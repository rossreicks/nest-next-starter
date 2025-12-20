import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { authModuleAsyncConfig } from "./auth";
import { validate } from "./config/configuration";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate,
		}),
		DatabaseModule,
		AuthModule.forRootAsync(authModuleAsyncConfig),
		HealthModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
