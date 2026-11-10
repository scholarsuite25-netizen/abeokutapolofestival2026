import { Resolver } from 'node:dns/promises';

async function traceDelegation() {
  console.log('=== TRACING DELEGATION ===');
  
  // 1. Query .ng ccTLD servers
  // Let's find .ng nameservers
  const resolver = new Resolver();
  resolver.setServers(['8.8.8.8']);
  const ngNs = await resolver.resolveNs('ng');
  console.log('.ng TLD nameservers:', ngNs);

  for (const ns of ngNs) {
    try {
      const nsIps = await resolver.resolve4(ns);
      console.log(`Resolved ${ns} -> ${nsIps[0]}`);
      const tldResolver = new Resolver();
      tldResolver.setServers([nsIps[0]]);
      try {
        const del = await tldResolver.resolveNs('abeokutapolofestival2026.org.ng');
        console.log(`Delegation from ${ns} (${nsIps[0]}):`, del);
      } catch (e) {
        console.log(`Query to ${ns} for NS failed:`, e.code || e.message);
      }
    } catch (e) {
      console.log(`Failed to resolve ${ns}:`, e.message);
    }
  }

  // 2. Query dns2.harmonweb.net specifically
  console.log('\n=== TESTING HARMONWEB DNS2 (162.19.227.133) ===');
  const dns2 = new Resolver();
  dns2.setServers(['162.19.227.133']);
  const queries = [
    { host: 'abeokutapolofestival2026.org.ng', type: 'SOA' },
    { host: 'abeokutapolofestival2026.org.ng', type: 'NS' },
    { host: 'abeokutapolofestival2026.org.ng', type: 'A' },
    { host: 'rsend.guests.abeokutapolofestival2026.org.ng', type: 'CNAME' },
  ];
  for (const q of queries) {
    try {
      let r;
      if (q.type === 'SOA') r = await dns2.resolveSoa(q.host);
      else if (q.type === 'NS') r = await dns2.resolveNs(q.host);
      else if (q.type === 'A') r = await dns2.resolve4(q.host);
      else if (q.type === 'CNAME') r = await dns2.resolveCname(q.host);
      console.log(`dns2 ${q.type} ${q.host}:`, r);
    } catch (e) {
      console.log(`dns2 ${q.type} ${q.host} FAILED:`, e.code || e.message);
    }
  }

  // 3. Query Cloudflare assigned NS: alla.ns.cloudflare.com and yadiel.ns.cloudflare.com
  console.log('\n=== TESTING CLOUDFLARE ASSIGNED NS ===');
  for (const cfNs of ['alla.ns.cloudflare.com', 'yadiel.ns.cloudflare.com']) {
    try {
      const cfIps = await resolver.resolve4(cfNs);
      console.log(`${cfNs} IP:`, cfIps[0]);
      const cfRes = new Resolver();
      cfRes.setServers([cfIps[0]]);
      try {
        const r = await cfRes.resolve4('abeokutapolofestival2026.org.ng');
        console.log(`${cfNs} resolve4:`, r);
      } catch (e) {
        console.log(`${cfNs} resolve4 FAILED:`, e.code || e.message);
      }
      try {
        const r = await cfRes.resolveCname('rsend.guests.abeokutapolofestival2026.org.ng');
        console.log(`${cfNs} resolveCname:`, r);
      } catch (e) {
        console.log(`${cfNs} resolveCname FAILED:`, e.code || e.message);
      }
    } catch (e) {
      console.log(`Failed to probe ${cfNs}:`, e.message);
    }
  }
}

traceDelegation().catch(console.error);
