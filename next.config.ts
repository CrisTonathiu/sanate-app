import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: [
            'framer-motion',
            'lucide-react',
            '@radix-ui/react-dropdown-menu',
            'radix-ui',
            '@tanstack/react-query'
        ]
    },
    images: {
        remotePatterns: [
            {
                protocol: 'http',
                hostname: '127.0.0.1'
            },
            {
                protocol: 'http',
                hostname: 'localhost'
            }
        ]
    }
};

export default nextConfig;
