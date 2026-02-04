import Link from "next/link";
import InstallAppButton from "./_components/InstallAppButton";

export default function Home() {
  return (
    <div className="">
      <h1 className="text-4xl">Smart Menu</h1>
      <Link
        href="/restaurant/6957e610dfe0f2ca815211f8"
        className="mt-6 inline-block rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500"
      >
        View Demo Restaurant
      </Link>
    </div>
  );
}