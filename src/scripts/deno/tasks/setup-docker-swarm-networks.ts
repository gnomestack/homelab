import { sshScript } from "./ssh.ts";


export async function setupDockerSwarmNetworks(target: string) {

    const getIngress = `docker network inspect ingress`;
    const ingressResult = await sshScript(target, getIngress, { stdout: "piped"});
    // deno-lint-ignore no-explicit-any
    const ingressInfo = JSON.parse(ingressResult.stdoutAsString)[0] as any;

    if (ingressInfo.IPAM.Config.Subnet !== "172.30.0.0/16")
    {
        const cmd = `yes y | docker network rm ingress --force`;
        await sshScript(target, cmd);
        const cmd2 = "docker network create -d overlay --ingress " + 
            "--subnet=172.30.0.0/16 --gateway=172.30.0.1 "+
            " --opt com.docker.network.driver.mtu=1400 ingress";

        await sshScript(target, cmd2);
    }

    const cmd3 = "docker network ls --format '{{.Name}}'"
    const availableNetworksResult = await sshScript(target, cmd3, { stdout: "piped"});
    const availableNetworks = availableNetworksResult.stdoutAsString
        .split("\n")
        .map(x => x.trim())
        .filter(x => x.length > 0);

    if (!availableNetworks.includes("vnet-frontend"))
    {
        const cmd4 = "docker network create -d overlay --subnet 172.19.0.0/16 --gateway 172.19.0.1 --attachable vnet_frontend"
        await sshScript(target, cmd4);
    }

    if (!availableNetworks.includes("vnet-backend"))
    {
        const cmd5 = "docker network create -d overlay --subnet 172.20.0.0/16 --gateway 172.20.0.1 --attachable vnet_backend"
        await sshScript(target, cmd5);
    }
}

