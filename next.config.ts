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
    }
};

export default nextConfig;
