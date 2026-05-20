import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
    // Allow ngrok (and similar) tunnels to load /_next/* assets in dev.
    allowedDevOrigins: ['*.ngrok-free.dev', '*.ngrok.io', '*.ngrok.app'],
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
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com'
            }
        ]
    }
};

export default nextConfig;
