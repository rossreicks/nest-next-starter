"use client";

import type { Example } from "@shared/types/example";
import { useEffect, useState } from "react";

export default function Home() {
	const [data, setData] = useState<Example | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchData() {
			try {
				const response = await fetch("/api");
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const result = await response.json();
				setData(result);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, []);

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
				<div className="flex flex-col items-center gap-6 text-center">
					<h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
						API Response
					</h1>
					{loading && (
						<p className="text-lg text-zinc-600 dark:text-zinc-400">
							Loading...
						</p>
					)}
					{error && (
						<p className="text-lg text-red-600 dark:text-red-400">
							Error: {error}
						</p>
					)}
					{data && (
						<p className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
							Name: {data.name}, Age: {data.age}
						</p>
					)}
				</div>
			</main>
		</div>
	);
}
