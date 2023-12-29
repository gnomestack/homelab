import { ps, IExecOptions } from "../deps.ts"

export async function sshScript(target: string, script: string, options?: IExecOptions) {
    const r = await ps.exec("ssh", ["-o", "StrictHostKeyChecking=no", target, script], options);
    r.throwOrContinue();
    return r;
}

export async function sshFile(target: string, file: string, options?: IExecOptions) {
    const script = await Deno.readTextFile(file);
    const r = await ps.exec("ssh", ["-o", "StrictHostKeyChecking=no", target, script], options);
    r.throwOrContinue();
    return r;
}

export async function scp(target: string, src: string, dest: string, options?: IExecOptions) {
    const r = await ps.exec("scp", ["-o", "StrictHostKeyChecking=no", src, `${target}:${dest}`], options);
    r.throwOrContinue();
    return r;
}