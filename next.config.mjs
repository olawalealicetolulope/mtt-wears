// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;
// next.config.mjs
const nextConfig = {
  // Remove missingSuspenseWithCSRBailout from here:
  experimental: {
    // missingSuspenseWithCSRBailout: false, <--- Delete this line
  },
};

export default nextConfig;