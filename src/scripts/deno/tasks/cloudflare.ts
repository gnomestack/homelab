import { ps, path, dotenv } from "../deps.ts"
const dir = path.dirname(path.fromFileUrl(import.meta.url));
const src = path.resolve(dir, "..", "..", "..");
const secretsFile = path.resolve(src, "etc", "secrets.env");


export async function updateDnsRecord(name: string, value: string, type = "A") {
    const r1 = await ps.exec("sops", ["-d", secretsFile], { stdout: "piped" });
    r1.throwOrContinue();
    const secrets = dotenv.parse(r1.stdoutAsString);
    const zone = secrets["TLD"];
    const token = secrets["CF_API_TOKEN"];
    Deno.env.set("CF_API_TOKEN", token);

    const r = await ps.exec("flarectl", ["dns", "o", "--zone", zone, "--name", name, "--type", type, "--content", value]);
    r.throwOrContinue();
}