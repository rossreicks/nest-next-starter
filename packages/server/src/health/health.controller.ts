import { Controller, Get } from "@nestjs/common";
import {
	DiskHealthIndicator,
	HealthCheck,
	HealthCheckResult,
	HealthCheckService,
	HttpHealthIndicator,
	MemoryHealthIndicator,
} from "@nestjs/terminus";

@Controller("health")
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private memory: MemoryHealthIndicator,
		private disk: DiskHealthIndicator,
		private http: HttpHealthIndicator,
	) {}

	/**
	 * Comprehensive health check including all services
	 * GET /api/health
	 */
	@Get()
	@HealthCheck()
	check() {
		return this.health.check([
			// Check memory usage - warn if using more than 300MB
			() => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024),
			// Check RSS memory - warn if using more than 300MB
			() => this.memory.checkRSS("memory_rss", 300 * 1024 * 1024),
			// Check disk storage - warn if using more than 80% of available space
			() =>
				this.disk.checkStorage("storage", {
					thresholdPercent: 0.8,
					path: "/",
				}),
		]);
	}

	/**
	 * Lightweight readiness probe
	 * Used by Kubernetes/Docker to determine if the app can accept traffic
	 * GET /health/ready
	 */
	@Get("ready")
	@HealthCheck()
	async readiness(): Promise<HealthCheckResult> {
		return this.health.check([
			// Only check critical services needed to serve requests
			// () => this.database.isHealthy("database"),
			() => this.http.pingCheck("google", "https://google.com"),
		]);
	}

	/**
	 * Lightweight liveness probe
	 * Used by Kubernetes/Docker to determine if the app is still running
	 * GET /api/health/live
	 */
	@Get("live")
	@HealthCheck()
	async liveness(): Promise<HealthCheckResult> {
		return this.health.check([
			// Just check memory to ensure the process hasn't crashed
			() => this.memory.checkHeap("memory_heap", 300 * 1024 * 1024),
		]);
	}
}
