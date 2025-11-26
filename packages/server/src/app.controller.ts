import { Controller, Get } from "@nestjs/common";
import { Example } from "@shared/types/example";
import { AppService } from "./app.service";

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): Promise<Example> {
		return this.appService.getHello();
	}
}
