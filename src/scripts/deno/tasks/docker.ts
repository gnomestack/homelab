import { ps, path, dotenv } from "../deps.ts"


export async function stackDeploy(stackName: string, context = "", variant = "swarm") {
    if (context.length > 0)
    {
        const r2 = await ps.exec("docker", ["context", "use", context]);
        r2.throwOrContinue();
    }
  

    const dir = path.dirname(path.fromFileUrl(import.meta.url));
    const src = path.resolve(dir, "..", "..", "..");
    const secretsFile = path.resolve(src, "etc", "secrets.env");
    const r1 = await ps.exec("sops", ["-d", secretsFile], { stdout: "piped" });
    r1.throwOrContinue();
    const secrets = dotenv.parse(r1.stdoutAsString);
    for (const key in secrets) {
        const value = secrets[key];
        Deno.env.set(key, value);
    }


    const composeFile = variant.length > 0 ? `${variant}.compose.yaml` : "compose.yaml";
    const dockerComposeFile = path.resolve(src, "compose", stackName, composeFile);
    const r = await ps.exec("docker", ["stack", "deploy", "-c", dockerComposeFile, stackName]);
    r.throwOrContinue();
}

export async function stackRemove(stackName: string, context = "") {
    if (context.length > 0)
    {
        const r2 = await ps.exec("docker", ["context", "use", context]);
        r2.throwOrContinue();
    
    }

    const r = await ps.exec("docker", ["stack", "rm", stackName]);
    r.throwOrContinue();
}