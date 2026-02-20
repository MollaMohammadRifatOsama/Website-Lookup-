export default async function handler(req, res) {
  const { domain } = req.query;
  if(!domain){
    return res.status(400).json({error:"No domain provided"});
  }

  try{
    // 1️⃣ IP Resolve via Google DNS
    const dnsRes = await fetch("https://dns.google/resolve?name="+domain);
    const dnsData = await dnsRes.json();
    const ip = dnsData.Answer ? dnsData.Answer[0].data : "Not Found";

    // 2️⃣ IP Info via ipwho.is
    const ipInfoRes = await fetch("https://ipwho.is/"+ip);
    const ipInfo = await ipInfoRes.json();

    // 3️⃣ Server Headers (basic)
    let server = "";
    try{
      const headRes = await fetch("https://"+domain, { method: "HEAD" });
      server = headRes.headers.get("server");
      var ssl = headRes.headers.get("strict-transport-security") ? "HTTPS Enabled" : "Unknown";
    }catch{
      server = "Unavailable";
      var ssl = "Unknown";
    }

    // 4️⃣ Subdomains via crt.sh
    let subdomains = [];
    try{
      const crtRes = await fetch("https://crt.sh/?q=%25."+domain+"&output=json");
      const crtData = await crtRes.json();
      subdomains = crtData.slice(0,10).map(e=>e.name_value);
    }catch{}

    // Response
    res.status(200).json({
      ip,
      country: ipInfo.country,
      org: ipInfo.connection?.org,
      server,
      ssl,
      subdomains
    });

  }catch(err){
    res.status(500).json({error:"Scan failed"});
  }
}
