// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;
/** @type {import('next').Next.js config} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;