import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	webpack: (config, { isServer }) => {
		if (isServer) {
			config.resolve.alias = {
				...config.resolve.alias,
				three: false,
				"three/examples/jsm/environments/RoomEnvironment.js": false,
				"three/src/math/MathUtils.js": false,
				"@react-three/fiber": false,
				"@react-three/drei": false,
				"@react-three/postprocessing": false,
			};
		}
		return config;
	},
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
