export namespace main {
	
	export class ActionResult {
	    success: boolean;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new ActionResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.message = source["message"];
	    }
	}
	export class AlertRules {
	    configured: boolean;
	    muted: boolean;
	    onOutage: boolean;
	    onFailedSvc: boolean;
	    cpuThreshold: number;
	    ramThreshold: number;
	    diskThreshold: number;
	    cooldownMin: number;
	
	    static createFrom(source: any = {}) {
	        return new AlertRules(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.configured = source["configured"];
	        this.muted = source["muted"];
	        this.onOutage = source["onOutage"];
	        this.onFailedSvc = source["onFailedSvc"];
	        this.cpuThreshold = source["cpuThreshold"];
	        this.ramThreshold = source["ramThreshold"];
	        this.diskThreshold = source["diskThreshold"];
	        this.cooldownMin = source["cooldownMin"];
	    }
	}
	export class AppSettings {
	    language: string;
	    viewMode: string;
	    privacyMode: boolean;
	    pollIntervalSec: number;
	    desktopAlerts: boolean;
	    minimizeToTray: boolean;
	    alertPrefsInit: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.language = source["language"];
	        this.viewMode = source["viewMode"];
	        this.privacyMode = source["privacyMode"];
	        this.pollIntervalSec = source["pollIntervalSec"];
	        this.desktopAlerts = source["desktopAlerts"];
	        this.minimizeToTray = source["minimizeToTray"];
	        this.alertPrefsInit = source["alertPrefsInit"];
	    }
	}
	export class CommandOutput {
	    success: boolean;
	    output: string;
	    durationMs: number;
	
	    static createFrom(source: any = {}) {
	        return new CommandOutput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.output = source["output"];
	        this.durationMs = source["durationMs"];
	    }
	}
	export class DiskMetric {
	    mount: string;
	    totalGB: number;
	    usedGB: number;
	    percent: number;
	
	    static createFrom(source: any = {}) {
	        return new DiskMetric(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mount = source["mount"];
	        this.totalGB = source["totalGB"];
	        this.usedGB = source["usedGB"];
	        this.percent = source["percent"];
	    }
	}
	export class DockerContainer {
	    id: string;
	    name: string;
	    image: string;
	    state: string;
	    status: string;
	    ports: string;
	
	    static createFrom(source: any = {}) {
	        return new DockerContainer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.image = source["image"];
	        this.state = source["state"];
	        this.status = source["status"];
	        this.ports = source["ports"];
	    }
	}
	export class OpenPort {
	    proto: string;
	    address: string;
	    port: string;
	    process: string;
	
	    static createFrom(source: any = {}) {
	        return new OpenPort(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.proto = source["proto"];
	        this.address = source["address"];
	        this.port = source["port"];
	        this.process = source["process"];
	    }
	}
	export class PTYStartResult {
	    success: boolean;
	    sessionId: string;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new PTYStartResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.sessionId = source["sessionId"];
	        this.error = source["error"];
	    }
	}
	export class ProcessInfo {
	    pid: number;
	    user: string;
	    cpu: number;
	    mem: number;
	    command: string;
	
	    static createFrom(source: any = {}) {
	        return new ProcessInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.pid = source["pid"];
	        this.user = source["user"];
	        this.cpu = source["cpu"];
	        this.mem = source["mem"];
	        this.command = source["command"];
	    }
	}
	export class ServerConfig {
	    id: string;
	    name: string;
	    host: string;
	    port: number;
	    username: string;
	    authType: string;
	    password: string;
	    keyPath: string;
	    privateKey: string;
	    group: string;
	    isDemo: boolean;
	    useProxy: boolean;
	    proxyHost: string;
	    proxyPort: number;
	    proxyUser: string;
	    proxyPass: string;
	    hasPassword: boolean;
	    hasPrivateKey: boolean;
	    hasProxyPass: boolean;
	    alertRules: AlertRules;
	
	    static createFrom(source: any = {}) {
	        return new ServerConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.username = source["username"];
	        this.authType = source["authType"];
	        this.password = source["password"];
	        this.keyPath = source["keyPath"];
	        this.privateKey = source["privateKey"];
	        this.group = source["group"];
	        this.isDemo = source["isDemo"];
	        this.useProxy = source["useProxy"];
	        this.proxyHost = source["proxyHost"];
	        this.proxyPort = source["proxyPort"];
	        this.proxyUser = source["proxyUser"];
	        this.proxyPass = source["proxyPass"];
	        this.hasPassword = source["hasPassword"];
	        this.hasPrivateKey = source["hasPrivateKey"];
	        this.hasProxyPass = source["hasProxyPass"];
	        this.alertRules = this.convertValues(source["alertRules"], AlertRules);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ServiceInfo {
	    name: string;
	    status: string;
	    subState: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new ServiceInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.status = source["status"];
	        this.subState = source["subState"];
	        this.description = source["description"];
	    }
	}
	export class ServerMetrics {
	    serverId: string;
	    online: boolean;
	    error: string;
	    timestamp: string;
	    latencyMs: number;
	    hostname: string;
	    os: string;
	    kernel: string;
	    uptime: string;
	    cpuPercent: number;
	    cpuCores: number;
	    load1: number;
	    load5: number;
	    load15: number;
	    ramTotalGB: number;
	    ramUsedGB: number;
	    ramPercent: number;
	    swapTotalGB: number;
	    swapUsedGB: number;
	    swapPercent: number;
	    netRxKBps: number;
	    netTxKBps: number;
	    diskPercent: number;
	    diskUsedGB: number;
	    diskTotalGB: number;
	    disks: DiskMetric[];
	    services: ServiceInfo[];
	    processes: ProcessInfo[];
	    dockerAvailable: boolean;
	    containers: DockerContainer[];
	    openPorts: OpenPort[];
	    firewallStatus: string;
	    healthScore: number;
	    healthIssues: string[];
	    failedServices: number;
	
	    static createFrom(source: any = {}) {
	        return new ServerMetrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.serverId = source["serverId"];
	        this.online = source["online"];
	        this.error = source["error"];
	        this.timestamp = source["timestamp"];
	        this.latencyMs = source["latencyMs"];
	        this.hostname = source["hostname"];
	        this.os = source["os"];
	        this.kernel = source["kernel"];
	        this.uptime = source["uptime"];
	        this.cpuPercent = source["cpuPercent"];
	        this.cpuCores = source["cpuCores"];
	        this.load1 = source["load1"];
	        this.load5 = source["load5"];
	        this.load15 = source["load15"];
	        this.ramTotalGB = source["ramTotalGB"];
	        this.ramUsedGB = source["ramUsedGB"];
	        this.ramPercent = source["ramPercent"];
	        this.swapTotalGB = source["swapTotalGB"];
	        this.swapUsedGB = source["swapUsedGB"];
	        this.swapPercent = source["swapPercent"];
	        this.netRxKBps = source["netRxKBps"];
	        this.netTxKBps = source["netTxKBps"];
	        this.diskPercent = source["diskPercent"];
	        this.diskUsedGB = source["diskUsedGB"];
	        this.diskTotalGB = source["diskTotalGB"];
	        this.disks = this.convertValues(source["disks"], DiskMetric);
	        this.services = this.convertValues(source["services"], ServiceInfo);
	        this.processes = this.convertValues(source["processes"], ProcessInfo);
	        this.dockerAvailable = source["dockerAvailable"];
	        this.containers = this.convertValues(source["containers"], DockerContainer);
	        this.openPorts = this.convertValues(source["openPorts"], OpenPort);
	        this.firewallStatus = source["firewallStatus"];
	        this.healthScore = source["healthScore"];
	        this.healthIssues = source["healthIssues"];
	        this.failedServices = source["failedServices"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class TriggeredAlert {
	    id: string;
	    serverId: string;
	    serverName: string;
	    type: string;
	    detail: string;
	    time: string;
	
	    static createFrom(source: any = {}) {
	        return new TriggeredAlert(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.serverId = source["serverId"];
	        this.serverName = source["serverName"];
	        this.type = source["type"];
	        this.detail = source["detail"];
	        this.time = source["time"];
	    }
	}

}

