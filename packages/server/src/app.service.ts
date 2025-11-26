import { Injectable } from "@nestjs/common";
import { Example } from "@shared/types/example";

@Injectable()
export class AppService {
	async getHello(): Promise<Example> {
		return await Promise.resolve({ name: "John", age: 30 });
	}
}
