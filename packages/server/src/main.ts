import { join } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import {
	ExpressAdapter,
	NestExpressApplication,
} from "@nestjs/platform-express";
import express, { Request, Response } from "express";
import Next from "next";
import { AppModule } from "./app.module";

async function bootstrap() {
	const nestExpress = express();
	const adapter = new ExpressAdapter(nestExpress);

	const app = await NestFactory.create<NestExpressApplication>(
		AppModule,
		adapter,
		{
			bodyParser: false,
		},
	);

	app.setGlobalPrefix("api");
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	// Initialize Next.js for all non-API requests
	const dev = process.env.NODE_ENV !== "production";
	const dir = join(__dirname, "../../client");
	const nextApp = Next({ dev, dir });
	const handle = nextApp.getRequestHandler();
	await nextApp.prepare();
	nestExpress.all(/^(?!\/api).*/, (req: Request, res: Response) =>
		handle(req, res),
	);

	// Start the NestJS application
	const config = app.get(ConfigService);
	const port = config.get<number>("PORT", 4000);
	await app.init();

	await app.listen(port);

	console.log(`✅ Ready on http://localhost:${port}`);
}
bootstrap();
