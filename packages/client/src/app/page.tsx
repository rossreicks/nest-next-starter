"use client";

import type { Example } from "@shared/types/example";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signIn, signOut, signUp, useSession } from "@/lib/client-auth";

export default function Home() {
	const [data, setData] = useState<Example | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { data: session } = useSession();
	const router = useRouter();
	const handleSignIn = async () => {
		await signIn.email({
			email: "test@test.com",
			password: "superlongSuperSecretPassword1234@@",
		});
		router.refresh();
	};

	const handleSignOut = async () => {
		await signOut();
		router.refresh();
	};

	const handleSignUp = async () => {
		await signUp.email({
			email: "test@test.com",
			password: "superlongSuperSecretPassword1234@@",
			name: "Test User",
		});
		router.refresh();
	};

	useEffect(() => {
		async function fetchData() {
			try {
				const response = await fetch("/api", {
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
				});
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

		if (session?.session?.id) {
			fetchData();
		}
	}, [session?.session?.id]);

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
					{session ? (
						<div className="flex flex-col items-center gap-3">
							<p className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
								Session: {session.user.email}
							</p>
							<button
								type="button"
								onClick={handleSignOut}
								className="px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
							>
								Sign out
							</button>
						</div>
					) : (
						<div className="flex flex-col items-center gap-3">
							<p className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
								You are not logged in.
							</p>
							<div className="flex gap-3">
								<button
									type="button"
									onClick={handleSignIn}
									className="px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
								>
									Sign in
								</button>
								<button
									type="button"
									onClick={handleSignUp}
									className="px-4 py-2 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
								>
									Sign up
								</button>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
