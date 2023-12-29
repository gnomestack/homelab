import { parseYaml } from "https://deno.land/x/quasar@0.0.8/deps.ts";
import { ps, path, dotenv, fs, env, hostWriter } from "../deps.ts"
import { scp, sshScript } from "./ssh.ts";
import { IS_WINDOWS } from "https://deno.land/x/quasar@0.0.8/mod.ts";
import { scriptRunner } from "https://deno.land/x/quasar@0.0.8/shell/core/script_runner.ts";


export async function createRemoteDir(stackName: string, context = "", variant = "swarm")
{
    const dir = path.dirname(path.fromFileUrl(import.meta.url));
    const src = path.resolve(dir, "..", "..", "..");

    const volumesFilename = variant.length > 0 ? `${variant}.dkr.yaml` : "dkr.yaml";
    const volumesFile = path.resolve(src, "compose", stackName, volumesFilename);

    if (await fs.exists(volumesFile))
    {
        if (context.length == 0)
        {
            const r = await ps.exec("docker", ["context", "show"], { stdout: 'piped'});
            r.throwOrContinue();
            context = r.stdoutAsLines[0];
        }

        const secretsFile = path.resolve(src, "etc", "secrets.env");
        const r1 = await ps.exec("sops", ["-d", secretsFile], { stdout: "piped" });
        r1.throwOrContinue();
        const secrets = dotenv.parse(r1.stdoutAsString);
        for (const key in secrets) {
            const value = secrets[key];
            Deno.env.set(key, value);
        }
    
        
        const yaml = await fs.readTextFile(volumesFile);
        const vf = parseYaml(yaml) as VolumeFile
        console.log(vf);
        if (vf.volumes)
        {
            for(const n in vf.volumes)
            {
                let v = vf.volumes[n];
                v = env.expand(v);

                console.log(n);
                console.log(vf.hosts)
                for(const n of vf.hosts)
                {
                    console.log(n);
                    const target = env.expand(n);
                    console.log(target);
                    sshScript(target, `
                        if [ ! -d "${v}" ]
                        then
                            mkdir -p ${v}
                        fi
                    `)
                }
            }
        }

        if (vf.files)
        {
            for(const n of vf.files)
            {
                const map = env.expand(n);
                const parts = map.split(":");

                if (parts.length != 2)
                {
                    continue;
                }

                let src2 = parts[0];
                const dest = parts[1];
                if (src2.startsWith("./"))
                    src2 = path.resolve(src, "compose", stackName, src2.substring(2));

                if (! await fs.exists(src2))
                {
                    hostWriter.warn(`unable to find ${src2}`);
                    continue;
                }

                for(const n of vf.hosts)
                {
                    console.log(n);
                    const target = env.expand(n);
                    await scp(target, src2, dest);
                }
            }
        }

        if (vf.cmds)
        {
            for(const cmd of vf.cmds)
            {
                cmd.shell ??= IS_WINDOWS ? "pwsh" : "bash"
                const script = cmd.run;

                await scriptRunner.runScript(cmd.shell, script);
            }
        }
        
    }
}

interface VolumeFile
{
    hosts: string[]
    volumes?: Record<string, string>
    files?: string[]
    cmds?: { run: string, shell?: 'bash' | 'pwsh' }[]
}

interface FilesFile 
{
    hosts: string[]
    files: string[]
}

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

    const volumesFilename = variant.length > 0 ? `${variant}.dkr.yaml` : "dkr.yaml";
    const volumesFile = path.resolve(src, "compose", stackName, volumesFilename);

    if (await fs.exists(volumesFile))
    {
        const yaml = await fs.readTextFile(volumesFile);
        const vf = parseYaml(yaml) as VolumeFile;
        for(const n in vf.volumes)
        {
            let v = vf.volumes[n];
            v = env.expand(v);

            console.log(`set ${n.toUpperCase()}`);
            Deno.env.set(n.toUpperCase(), v);
        }
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