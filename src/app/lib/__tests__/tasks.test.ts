import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

// Keeps tasks/tasks.json consistent. Before starting a task, all its dependencies must be
// done (see ai-guidelines.md). These checks make sure the dependency graph can be trusted.
const ROOT = path.resolve(__dirname, '../../../..')
type Task = { id: number; title: string; status: string; dependencies: number[] }
const tasks: Task[] = JSON.parse(readFileSync(path.join(ROOT, 'tasks/tasks.json'), 'utf8')).tasks
const byId = new Map(tasks.map((t) => [t.id, t]))

describe('tasks/tasks.json', () => {
  it('has unique ids and valid statuses', () => {
    expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length)
    for (const t of tasks) expect(['pending', 'in-progress', 'done']).toContain(t.status)
  })

  it('every dependency points to an existing, different task', () => {
    const bad = tasks.flatMap((t) =>
      t.dependencies.filter((d) => d === t.id || !byId.has(d)).map((d) => `${t.id} -> ${d}`),
    )
    expect(bad).toEqual([])
  })

  it('has no dependency cycles', () => {
    const state = new Map<number, 'visiting' | 'done'>()
    const cycles: string[] = []
    const visit = (id: number, trail: number[]) => {
      if (state.get(id) === 'done') return
      if (state.get(id) === 'visiting') {
        cycles.push([...trail.slice(trail.indexOf(id)), id].join(' -> '))
        return
      }
      state.set(id, 'visiting')
      for (const d of byId.get(id)?.dependencies ?? []) visit(d, [...trail, id])
      state.set(id, 'done')
    }
    tasks.forEach((t) => visit(t.id, []))
    expect(cycles).toEqual([])
  })

  it('a done task has only done dependencies', () => {
    const bad = tasks
      .filter((t) => t.status === 'done')
      .flatMap((t) => t.dependencies.filter((d) => byId.get(d)?.status !== 'done').map((d) => `${t.id} -> ${d}`))
    expect(bad).toEqual([])
  })

  it('task_NNN.txt mirrors status and dependencies', () => {
    const mismatches = tasks.flatMap((t) => {
      const file = path.join(ROOT, `tasks/task_${String(t.id).padStart(3, '0')}.txt`)
      if (!existsSync(file)) return [`${t.id}: missing txt`]
      const txt = readFileSync(file, 'utf8')
      const status = txt.match(/^# Status: (.*)$/m)?.[1]?.trim()
      const deps = (txt.match(/^# Dependencies: (.*)$/m)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean).map(Number)
      const out: string[] = []
      if (status !== t.status) out.push(`${t.id}: status ${status} != ${t.status}`)
      if (deps.join(',') !== t.dependencies.join(',')) out.push(`${t.id}: deps ${deps} != ${t.dependencies}`)
      return out
    })
    expect(mismatches).toEqual([])
  })
})
