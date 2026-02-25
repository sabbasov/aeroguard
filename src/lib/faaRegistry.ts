const FAA_REGISTRY_URL =
  "https://registry.faa.gov/aircraftinquiry/Search/NNumberResult";

export interface RegistryData {
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  engineManufacturer?: string;
  engineModel?: string;
  year?: string;
  registrant?: string;
  [key: string]: string | undefined;
}

export async function fetchFAARegistry(
  nNumber: string
): Promise<RegistryData | null> {
  const clean = nNumber.replace(/^N/i, "").trim();
  if (!clean) return null;

  try {
    const res = await fetch(FAA_REGISTRY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Origin: "https://registry.faa.gov",
        Referer:
          "https://registry.faa.gov/aircraftinquiry/Search/NNumberInquiry",
      },
      body: new URLSearchParams({ NNumbertxt: clean }),
    });

    if (!res.ok) return null;

    const html = await res.text();
    const data: RegistryData = {};

    const rowRe =
      /<td[^>]*>\s*(.*?)\s*<\/td>\s*<td[^>]*>\s*(.*?)\s*<\/td>/gi;
    let match: RegExpExecArray | null;

    while ((match = rowRe.exec(html)) !== null) {
      const label = match[1]
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .replace(/:$/, "")
        .trim();
      const value = match[2]
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (!label || !value) continue;

      const key = label.toLowerCase();
      if (key.includes("manufacturer") && !key.includes("engine"))
        data.manufacturer = value;
      else if (key.includes("model") && !key.includes("engine"))
        data.model = value;
      else if (key.includes("serial")) data.serialNumber = value;
      else if (key.includes("engine") && key.includes("manufacturer"))
        data.engineManufacturer = value;
      else if (key.includes("engine") && key.includes("model"))
        data.engineModel = value;
      else if (key.includes("year")) data.year = value;
      else if (key.includes("name") || key.includes("registrant"))
        data.registrant = value;

      data[label] = value;
    }

    if (Object.keys(data).length === 0) return null;
    return data;
  } catch {
    return null;
  }
}
