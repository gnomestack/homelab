import { Command, green, hostWriter, path, ps } from "../deps.ts";
import { updateDnsRecord } from "../tasks/cloudflare.ts";
import { stackDeploy, stackRemove } from "../tasks/docker.ts";


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
    .action(async ({ context, variant }, svc) => {
        if (svc === null || svc === undefined) {
            throw new Error("--svc (service name) is required.");
        }
        context ??= "";
        variant ??= "swarm";

        await stackDeploy(svc, context, variant);
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

