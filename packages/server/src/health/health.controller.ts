import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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
		private configService: ConfigService,
	) {}

	/**
	 * Comprehensive health check including all services
	 * GET /api/health
	 */
	@Get()
	@HealthCheck()
	check() {
		const memoryHeapThreshold =
			this.configService.get<number>("HEALTH_MEMORY_HEAP_THRESHOLD_MB", 150) *
			1024 *
			1024;
		const memoryRSSThreshold =
			this.configService.get<number>("HEALTH_MEMORY_RSS_THRESHOLD_MB", 500) *
			1024 *
			1024;

		return this.health.check([
			// Check memory usage - warn if using more than configured threshold (default: 150MB)
			() => this.memory.checkHeap("memory_heap", memoryHeapThreshold),
			// Check RSS memory - warn if using more than configured threshold (default: 500MB)
			() => this.memory.checkRSS("memory_rss", memoryRSSThreshold),
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
		const memoryHeapThreshold =
			this.configService.get<number>("HEALTH_MEMORY_HEAP_THRESHOLD_MB", 150) *
			1024 *
			1024;

		return this.health.check([
			// Just check memory to ensure the process hasn't crashed
			() => this.memory.checkHeap("memory_heap", memoryHeapThreshold),
		]);
	}
}
