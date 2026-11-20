// Test-only module hooks: lets `node --test` resolve the app's "@/..." alias and
// extensionless relative imports in .ts files. Not used by Next.js.
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SUFFIXES = ['', '.ts', '.tsx', '/index.ts']

const isFile = (p) => existsSync(p) && statSync(p).isFile()

function tryResolve(base) {
  for (const suffix of SUFFIXES) {
    if (isFile(base + suffix)) return pathToFileURL(base + suffix).href
  }
  return null
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const url = tryResolve(path.join(root, specifier.slice(2)))
    if (url) return nextResolve(url, context)
  } else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL))
    const url = tryResolve(path.resolve(parentDir, specifier))
    if (url) return nextResolve(url, context)
  }
  return nextResolve(specifier, context)
}
