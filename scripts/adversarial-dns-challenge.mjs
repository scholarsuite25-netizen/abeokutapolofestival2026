import { Resolver } from 'node:dns/promises';
import crypto from 'node:crypto';

const RESOLVERS = [
  { name: 'Google Public DNS', ip: '8.8.8.8' },
  { name: 'Cloudflare Anycast', ip: '1.1.1.1' },
  { name: 'HarmonWeb Authoritative NS (dns1)', ip: '162.19.227.132' },
  { name: 'HarmonWeb Authoritative NS (dns2)', ip: '162.19.227.133' },
];

const RECORDS_TO_TEST = [
  { host: 'abeokutapolofestival2026.org.ng', types: ['A', 'NS', 'SOA'] },
  { host: 'www.abeokutapolofestival2026.org.ng', types: ['CNAME', 'A'] },
  { host: 'resend._domainkey.guests.abeokutapolofestival2026.org.ng', types: ['TXT'] },
  { host: 'rsend.guests.abeokutapolofestival2026.org.ng', types: ['CNAME', 'A'] },
  { host: 'send.guests.abeokutapolofestival2026.org.ng', types: ['CNAME', 'A'] },
  { host: 'guests.abeokutapolofestival2026.org.ng', types: ['MX', 'TXT'] },
  { host: '_dmarc.abeokutapolofestival2026.org.ng', types: ['TXT'] },
  { host: '_dmarc.guests.abeokutapolofestival2026.org.ng', types: ['TXT'] },
];

async function runResolverQuery(resolverIp, host, type) {
  const resolver = new Resolver();
  resolver.setServers([resolverIp]);
  try {
    switch (type) {
      case 'A': return await resolver.resolve4(host);
      case 'AAAA': return await resolver.resolve6(host);
      case 'CNAME': return await resolver.resolveCname(host);
      case 'TXT': return await resolver.resolveTxt(host);
      case 'MX': return await resolver.resolveMx(host);
      case 'NS': return await resolver.resolveNs(host);
      case 'SOA': return await resolver.resolveSoa(host);
      default: throw new Error(`Unknown type ${type}`);
    }
  } catch (err) {
    return { error: err.code || err.message };
  }
}

async function main() {
  console.log('================================================================');
  console.log('ADVERSARIAL DNS RESOLUTION MATRIX');
  console.log('================================================================');

  const results = {};

  for (const record of RECORDS_TO_TEST) {
    console.log(`\nTesting Host: ${record.host}`);
    results[record.host] = {};
    for (const type of record.types) {
      results[record.host][type] = {};
      console.log(`  Type: ${type}`);
      for (const res of RESOLVERS) {
        const queryResult = await runResolverQuery(res.ip, record.host, type);
        results[record.host][type][res.name] = queryResult;
        console.log(`    [${res.name} (${res.ip})]: ${JSON.stringify(queryResult)}`);
      }
    }
  }

  console.log('\n================================================================');
  console.log('CRYPTOGRAPHIC & RESILIENCE PROBES');
  console.log('================================================================');

  // Probe DKIM RSA key
  let dkimRecord = null;
  const dkimResolvers = ['162.19.227.132', '8.8.8.8', '1.1.1.1'];
  for (const ip of dkimResolvers) {
    const res = await runResolverQuery(ip, 'resend._domainkey.guests.abeokutapolofestival2026.org.ng', 'TXT');
    if (Array.isArray(res) && res.length > 0) {
      dkimRecord = res.map(chunks => chunks.join('')).join('');
      console.log(`Retrieved DKIM from ${ip}: ${dkimRecord.substring(0, 40)}...`);
      break;
    }
  }

  if (dkimRecord) {
    const match = dkimRecord.match(/p=([A-Za-z0-9+/=]+)/);
    if (match) {
      const b64Key = match[1];
      console.log(`Extracted public key base64 length: ${b64Key.length}`);
      const der = Buffer.from(b64Key, 'base64');
      console.log(`DER buffer byte length: ${der.length}`);
      const pem = `-----BEGIN PUBLIC KEY-----\n${b64Key.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----\n`;
      try {
        const keyObj = crypto.createPublicKey(pem);
        console.log(`Key Type: ${keyObj.type}`);
        console.log(`Asymmetric Key Type: ${keyObj.asymmetricKeyType}`);
        const details = keyObj.asymmetricKeyDetails;
        console.log(`Key Details:`, JSON.stringify(details));
        if (details.modulusLength === 1024) {
          console.log(`SUCCESS: Valid 1024-bit RSA key confirmed.`);
        } else {
          console.warn(`WARNING: Key modulus is ${details.modulusLength} bits, not 1024!`);
        }
      } catch (e) {
        console.error(`FAILED to import public key into crypto:`, e.message);
      }
    } else {
      console.error(`No 'p=' tag found in DKIM record`);
    }
  } else {
    console.error(`Failed to retrieve DKIM record from any resolver!`);
  }

  // Probe SPF alignment under proxying
  console.log('\nTesting SPF alignment under proxying:');
  const spfHosts = ['rsend.guests.abeokutapolofestival2026.org.ng', 'send.guests.abeokutapolofestival2026.org.ng'];
  for (const sh of spfHosts) {
    const res = await runResolverQuery('8.8.8.8', sh, 'CNAME');
    console.log(`SPF Host ${sh} CNAME:`, res);
    // If proxied by Cloudflare:
    // CNAME is flattened or returns Cloudflare anycast IPs (104.x.x.x, 172.67.x.x)
    // Resend mail servers send emails from RMTA forge IPs.
    // The SPF check for guests.abeokutapolofestival2026.org.ng or rsend.guests evaluates the A/CNAME record.
    // If proxied, the receiving MTA will see Cloudflare proxy IPs, which do NOT match Resend's sending IPs!
    // Result: SPF FAIL / SoftFail!
  }

  // Probe MX record
  console.log('\nTesting MX record:');
  const mxRes = await runResolverQuery('8.8.8.8', 'guests.abeokutapolofestival2026.org.ng', 'MX');
  console.log('MX resolution on Google DNS:', JSON.stringify(mxRes));
  const mxAuth = await runResolverQuery('162.19.227.132', 'guests.abeokutapolofestival2026.org.ng', 'MX');
  console.log('MX resolution on Authoritative NS:', JSON.stringify(mxAuth));

  // Probe DMARC syntax
  console.log('\nTesting DMARC records:');
  const dmarcResApex = await runResolverQuery('8.8.8.8', '_dmarc.abeokutapolofestival2026.org.ng', 'TXT');
  console.log('DMARC apex:', JSON.stringify(dmarcResApex));
  const dmarcResGuests = await runResolverQuery('8.8.8.8', '_dmarc.guests.abeokutapolofestival2026.org.ng', 'TXT');
  console.log('DMARC guests:', JSON.stringify(dmarcResGuests));
  const dmarcAuthApex = await runResolverQuery('162.19.227.132', '_dmarc.abeokutapolofestival2026.org.ng', 'TXT');
  console.log('DMARC auth apex:', JSON.stringify(dmarcAuthApex));
}

main().catch(console.error);
