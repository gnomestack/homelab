import { Command, green, hostWriter, path, ps } from "../deps.ts";
import { updateDnsRecord } from "../tasks/cloudflare.ts";
import { createRemoteDir, stackDeploy, stackRemove } from "../tasks/docker.ts";
import { setupDockerSwarmNetworks } from "../tasks/setup-docker-swarm-networks.ts";
import { setupUbuntuServer } from "../tasks/setup-ubuntu-server.ts";


const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const src = path.resolve(__dirname, "..", "..", "..");

export const swarmUpCommand = new Command()
    .description("runs stack deploy for a given service")
    .arguments("[svc:string]")
    .option("-c --context <context:string>", "docker context to use")
    .option("-v --variant <variant:string>", "variant of compose file to use")
    .complete("svc", async () => {
        const items: string[] = [];
        for await (const entry of Deno.readDir(path.join(src, "compose"))) {
            if (entry.isDirectory) {
                items.push(entry.name);
            }
        }

        console.log(items);

        return items;
    })
    .action(async ({ context, variant}, svc) => {
        if (svc === null || svc === undefined) {
            throw new Error("--svc (service name) is required.");
        }
        context ??= "";
        variant ??= "swarm";

        await stackDeploy(svc, context, variant);
        hostWriter.writeLine(green("done"));
    });

export const swarmMountsCommand = new Command()
    .description("creates folders for mounts on configured hosts")
    .arguments("[svc:string]")
    .option("-c --context <context:string>", "docker context to use")
    .option("-v --variant <variant:string>", "variant of compose file to use")
    .action(async ({ context, variant}, svc) => {
        if (svc === null || svc === undefined) {
            throw new Error("--svc (service name) is required.");
        }
        context ??= "";
        variant ??= "swarm";

        
        await createRemoteDir(svc, context, variant);
        hostWriter.writeLine(green("done"));
    });

export const swarmDownCommand = new Command()
    .description("runs docker stack remove for a given service")
    .arguments("[svc:string]")
    .option("-c --context <context:string>", "docker context to use")
    .action(async ({ context }, svc) => {
        console.log("svc", svc);
        if (svc === null || svc === undefined) {
            throw new Error("--svc (service name) is required.");
        }
        context ??= "";

        await stackRemove(svc, context);
        hostWriter.writeLine(green("done"));
    });

export const swarmCommand = new Command()
    .description("swarm commands")
    .command("up", swarmUpCommand)
    .command("down", swarmDownCommand)
    .command("create-mounts", swarmMountsCommand)


export const editSecretEnvCommand = new Command()
    .description("edits the secret file")
    .action(async () => {

        const editor = Deno.env.get("EDITOR");
        Deno.env.set("EDITOR", "code --wait");
        const dir = path.dirname(path.fromFileUrl(import.meta.url));
        const src = path.resolve(dir, "..", "..", "..");
        const secretsFile = path.resolve(src, "etc", "secrets.env");
        const r1 = await ps.exec("sops", [secretsFile]);
        if (!editor)
            Deno.env.delete("EDITOR");
        else
            Deno.env.set("EDITOR", editor);
        r1.throwOrContinue();
    });

export const envCommand = new Command()
    .description("environment commands")
    .command("edit", editSecretEnvCommand);

export const cfUpdateDnsRecordCommand = new Command()
    .description("updates a cloudflare dns record")
    .arguments("<name:string> <value:string>")
    .option("-t --type <type:string>", "dns record type")
    .action(async ({ type }, name, value) => {
        type ??= "A";
    
        await updateDnsRecord(name, value, type);
        hostWriter.writeLine(green("done"));
    });


export const cfCommand = new Command()
    .description("cloudflare commands")
    .command("dns", cfUpdateDnsRecordCommand)

export const setupHostCommand = new Command()
    .description("sets up the host")
    .option("-t --target <target:string>", "the target machine")
    .option("-p --pass <pass:string>", "the password for the sudo user")
    .action(async ({target, pass}) => {
        if (!target) {
            throw new Error("target is required");
        }

        if (!pass) {
            throw new Error("pass is required");
        }


        await setupUbuntuServer(target, pass);
    });

export const setupDockerSwarmNetworkCommand = new Command()
    .description("sets up docker swarm networks")
    .option("-o --dummy <target:string>", "the target machine")
    .option("-t --target <target:string>", "the target machine")
    .action(async({target}) => {
        if (!target) {
            throw new Error("target is required");
        }

        await setupDockerSwarmNetworks(target);
    })

export const vmCommand = new Command()
    .description("vm")
    .command("setup-docker-host", setupHostCommand)
    .command("setup-docker-swarm-networks", setupDockerSwarmNetworkCommand);