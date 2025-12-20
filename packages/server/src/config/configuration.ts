import { plainToClass } from "class-transformer";
import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	IsUrl,
	Max,
	Min,
	MinLength,
} from "class-validator";

export enum Environment {
	Development = "development",
	Production = "production",
}

export class EnvironmentVariables {
	@IsEnum(Environment)
	@IsOptional()
	NODE_ENV: Environment = Environment.Development;

	@IsNumber()
	@Min(0)
	@Max(65535)
	@IsOptional()
	PORT: number = 3000;

	@IsNumber()
	@Min(0)
	@Max(100)
	@IsOptional()
	HEALTH_MEMORY_HEAP_THRESHOLD_MB: number = 150;

	@IsNumber()
	@Min(0)
	@Max(100)
	@IsOptional()
	HEALTH_MEMORY_RSS_THRESHOLD_MB: number = 500;

	@IsUrl()
	@IsOptional()
	DATABASE_URL?: string;

	@IsString()
	@IsOptional()
	DB_HOST?: string;

	@IsNumber()
	@Min(0)
	@Max(65535)
	@IsOptional()
	DB_PORT?: number;

	@IsString()
	@IsOptional()
	DB_NAME?: string;

	@IsString()
	@IsOptional()
	DB_USER?: string;

	@IsString()
	@IsOptional()
	DB_PASSWORD?: string;

	// Better Auth Configuration. generate with: openssl rand -base64 32
	@IsString()
	@MinLength(32)
	@IsOptional()
	BETTER_AUTH_SECRET?: string;

	// OAuth Providers
	@IsString()
	@IsOptional()
	GITHUB_CLIENT_ID?: string;

	@IsString()
	@IsOptional()
	GITHUB_CLIENT_SECRET?: string;

	@IsString()
	@IsOptional()
	GOOGLE_CLIENT_ID?: string;

	@IsString()
	@IsOptional()
	GOOGLE_CLIENT_SECRET?: string;
}

export type AppConfig = InstanceType<typeof EnvironmentVariables>;

export function validate(config: Record<string, unknown>) {
	const validatedConfig = plainToClass(EnvironmentVariables, config, {
		enableImplicitConversion: true,
	});

	return validatedConfig;
}
