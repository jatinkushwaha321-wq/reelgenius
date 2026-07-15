import mongoose from 'mongoose';
import dns from 'node:dns';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Temporary DNS resolver workaround.
 *
 * Some Windows environments incorrectly route Node's DNS resolution
 * through 127.0.0.1, causing MongoDB Atlas SRV/TXT lookups to fail
 * with ECONNREFUSED even when the operating system resolves them correctly.
 *
 * This patch redirects Atlas DNS lookups through a dedicated Resolver
 * configured with public DNS servers.
 *
 * Remove this workaround once the underlying Node/runtime behavior
 * is confirmed fixed across supported environments.
 */
try {
  const patchModule = (mod) => {
    if (!mod) return;
    
    // Patch generic resolve method used by MongoDB connection_string.js
    const originalResolve = mod.resolve;
    if (originalResolve) {
      mod.resolve = function (address, rrtype, ...args) {
        const resolver = new dns.promises.Resolver();
        resolver.setServers(['1.1.1.1', '8.8.8.8']);
        return resolver.resolve(address, rrtype, ...args);
      };
    }

    // Patch resolveSrv
    const originalResolveSrv = mod.resolveSrv;
    if (originalResolveSrv) {
      mod.resolveSrv = function (hostname, ...args) {
        const resolver = new dns.promises.Resolver();
        resolver.setServers(['1.1.1.1', '8.8.8.8']);
        return resolver.resolveSrv(hostname, ...args);
      };
    }

    // Patch resolveTxt
    const originalResolveTxt = mod.resolveTxt;
    if (originalResolveTxt) {
      mod.resolveTxt = function (hostname, ...args) {
        const resolver = new dns.promises.Resolver();
        resolver.setServers(['1.1.1.1', '8.8.8.8']);
        return resolver.resolveTxt(hostname, ...args);
      };
    }
  };

  // Patch callback-based dns
  patchModule(dns);
  
  // Patch promises-based dns
  if (dns.promises) {
    patchModule(dns.promises);
  }

  // Also set process-global servers
  const servers = dns.getServers();
  if (servers.includes('127.0.0.1') && servers.length === 1) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  }
} catch (err) {
  console.error('=== MONGODB DNS PATCH ERROR ===', err);
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents database connections from growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
