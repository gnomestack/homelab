
import { hostWriter, IPsStartInfo, preCallHooks, WriteLevel } from "./deps.ts";
import { Command, HelpCommand, CompletionsCommand } from "./deps.ts";
import { swarmCommand, envCommand, cfCommand } from "./cmds/core.ts";

preCallHooks.push((si: IPsStartInfo) => {
    hostWriter.command(si.file.toString(), si.args || []);
});

hostWriter.level = WriteLevel.Command;

if (Deno.args.includes("--debug") || Deno.args.includes("-d")) {
    hostWriter.level = WriteLevel.Debug;
}

if (Deno.args.includes("--verbose") || Deno.args.includes("-v")) {
    hostWriter.level = WriteLevel.Trace;
}

const cmd = new Command();
cmd
    .version("0.0.1")
    .description("aft docker compose templates")
    .globalOption("-d --debug [debug:boolean]", "enable debug mode")
    .globalOption("-v --verbose [verbose:boolean]", "enable trace (verbose) mode")
    .action(async () => {
        await cmd.showHelp();
    })
    .command("swarm", swarmCommand)
    .command("cloudflare", cfCommand)
    .command("env", envCommand)
    .command("completions", new CompletionsCommand())
    .hidden()
    .command("help", new HelpCommand().global())
    .hidden();
    

try {
    await cmd.parse(Deno.args);
} catch (error) {
    hostWriter.error(error);
    Deno.exit(1);
}