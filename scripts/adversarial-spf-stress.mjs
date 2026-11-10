import { Resolver } from 'node:dns/promises';

async function testSpfLoop() {
  const hosts = ['rsend.guests.abeokutapolofestival2026.org.ng', 'send.guests.abeokutapolofestival2026.org.ng'];
  const ips = ['8.8.8.8', '1.1.1.1', '162.19.227.132'];
  
  let passes = 0;
  let failures = 0;
  for (let i = 0; i < 5; i++) {
    for (const h of hosts) {
      for (const ip of ips) {
        const resolver = new Resolver();
        resolver.setServers([ip]);
        try {
          const res = await resolver.resolveCname(h);
          console.log(`PASS [Iter ${i}] [${ip}] ${h} -> ${JSON.stringify(res)}`);
          passes++;
        } catch (e) {
          console.error(`FAIL [Iter ${i}] [${ip}] ${h} -> ${e.code || e.message}`);
          failures++;
        }
      }
    }
  }
  console.log(`\nResults: ${passes} passed, ${failures} failed.`);
}

testSpfLoop().catch(console.error);
