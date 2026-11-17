import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, CodeXml, Mail, UserRound, X } from 'lucide-react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { OrbitControls } from 'three-stdlib'
import { useCameraCtrlStore } from '../World/SBCamera'
import { sbCreatorProfile, type SBCreatorProfile } from './SBCreatorProfile'
import './SBAboutCreator.css'

function isOutsideDialog(
    event: ReactMouseEvent<HTMLDialogElement> | ReactPointerEvent<HTMLDialogElement>,
) {
    if (event.target !== event.currentTarget) return false
    const bounds = event.currentTarget.getBoundingClientRect()
    return event.clientX < bounds.left || event.clientX > bounds.right
        || event.clientY < bounds.top || event.clientY > bounds.bottom
}

function isPublicDestination(href?: string): href is string {
    return !!href && /^(https?:\/\/|mailto:)/i.test(href)
}

// OrbitControls is an imperative Three.js resource, not immutable React state.
function suspendCameraControls(controls: OrbitControls) {
    const wasEnabled = controls.enabled
    controls.enabled = false
    return () => { controls.enabled = wasEnabled }
}

/**
 * Owns its state independently of Sandbox. Opening a biography must not rerender
 * the scene, remount its models, or reset transient pivot/camera state.
 */
export function SBAboutCreator({ profile = sbCreatorProfile }: { profile?: SBCreatorProfile }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCompact, setIsCompact] = useState(
        () => window.matchMedia('(max-width: 640px)').matches,
    )
    const dialogRef = useRef<HTMLDialogElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)
    const backdropPointerDown = useRef(false)
    const openRequested = useRef(false)
    const cameraControls = useCameraCtrlStore((state) => state.orbitalCameraCtrl)
    const id = useId()
    const dialogId = `sb-creator-${id}`
    const titleId = `${dialogId}-title`
    const descriptionId = `${dialogId}-description`
    const open = useCallback(() => {
        openRequested.current = true
        setIsOpen(true)
    }, [])
    const close = useCallback(() => {
        openRequested.current = false
        setIsOpen(false)
    }, [])

    useEffect(() => {
        const query = window.matchMedia('(max-width: 640px)')
        const update = () => setIsCompact(query.matches)
        update()
        query.addEventListener('change', update)
        return () => query.removeEventListener('change', update)
    }, [])

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return
        if (isOpen && !dialog.open) {
            dialog.showModal()
            closeRef.current?.focus({ preventScroll: true })
        } else if (!isOpen && dialog.open) {
            dialog.close()
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen || !cameraControls) return
        return suspendCameraControls(cameraControls)
    }, [isOpen, cameraControls])

    const links = profile.links.filter(
        (link): link is typeof link & { href: string } => isPublicDestination(link.href),
    )
    const trigger = (
        <button
            ref={triggerRef}
            type="button"
            className="sb-about-trigger"
            aria-haspopup="dialog"
            aria-controls={dialogId}
            aria-expanded={isOpen}
            onClick={open}
        >
            <UserRound size={17} aria-hidden="true" />
            <span>About the creator</span>
        </button>
    )

    return (
        <>
            {/* The old editor shell overflows on phones. A portaled trigger stays
                reachable there without changing the editor's existing layout. */}
            {isCompact ? createPortal(trigger, document.body) : trigger}
            {createPortal(
                <dialog
                    ref={dialogRef}
                    id={dialogId}
                    className="sb-about-dialog"
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                    aria-modal="true"
                    onCancel={(event) => {
                        event.preventDefault()
                        close()
                    }}
                    onClose={() => {
                        // Native close events are queued. Do not let an old one
                        // close a newly reopened dialog or steal its focus.
                        if (openRequested.current) return
                        backdropPointerDown.current = false
                        triggerRef.current?.focus({ preventScroll: true })
                    }}
                    onKeyDown={(event) => {
                        event.stopPropagation()
                        if (event.key !== 'Tab') return
                        const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
                            'button:not(:disabled), a[href]',
                        )
                        const first = focusable[0]
                        const last = focusable[focusable.length - 1]
                        const active = document.activeElement
                        if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
                            event.preventDefault()
                            last?.focus()
                        } else if (!event.shiftKey && (active === last || !event.currentTarget.contains(active))) {
                            event.preventDefault()
                            first?.focus()
                        }
                    }}
                    onPointerDown={(event) => {
                        backdropPointerDown.current = isOutsideDialog(event)
                    }}
                    onPointerCancel={() => { backdropPointerDown.current = false }}
                    onClick={(event) => {
                        if (backdropPointerDown.current && isOutsideDialog(event)) close()
                        backdropPointerDown.current = false
                    }}
                >
                    <div className="sb-about-header">
                        <span className="sb-about-eyebrow">About the creator</span>
                        <button
                            ref={closeRef}
                            type="button"
                            className="sb-about-close"
                            aria-label="Close creator information"
                            title="Close"
                            onClick={close}
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                    </div>

                    <p id={titleId} className="sb-about-title">
                        Hi, I'm 
                        <span className="text-[var(--sb-about-text-author-color)]"> {profile.name}</span>
                        .
                    </p>
                    <p className="sb-about-role">{profile.role}</p>
                    <p className="sb-about-location">{profile.location}</p>

                    <div className="sb-about-bio">
                        {profile.bio.map((paragraph, index) => (
                            <p key={paragraph} id={index === 0 ? descriptionId : undefined}>
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <section className="sb-about-project" aria-labelledby={`${dialogId}-project`}>
                        <h3 id={`${dialogId}-project`}>{profile.projectName}</h3>
                        <p>{profile.projectDescription}</p>
                        {isPublicDestination(profile.projectSourceUrl) && (
                            <a
                                className="sb-about-source"
                                href={profile.projectSourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="View this project’s code (opens in a new tab)"
                            >
                                View this project’s code
                                <ArrowUpRight size={16} aria-hidden="true" />
                            </a>
                        )}
                    </section>

                    {links.length > 0 && (
                        <nav className="sb-about-links" aria-label="Creator profiles and contact">
                            {links.map((link, index) => {
                                const Icon = link.kind === 'github' ? CodeXml
                                    : link.kind === 'linkedin' ? BriefcaseBusiness
                                        : link.kind === 'email' ? Mail : ArrowUpRight
                                const newTab = !link.href.toLowerCase().startsWith('mailto:')
                                return (
                                    <a
                                        key={link.href}
                                        className={`sb-about-link ${index === 0 ? 'sb-about-link-primary' : ''}`}
                                        href={link.href}
                                        target={newTab ? '_blank' : undefined}
                                        rel={newTab ? 'noopener noreferrer' : undefined}
                                        aria-label={`${link.label}${newTab ? ' (opens in a new tab)' : ''}`}
                                    >
                                        <Icon size={18} aria-hidden="true" />
                                        {link.label}
                                        {newTab && <ArrowUpRight size={16} aria-hidden="true" />}
                                    </a>
                                )
                            })}
                        </nav>
                    )}

                    <footer className="sb-about-footer">
                        <button type="button" className="sb-about-back" onClick={close}>
                            <ArrowLeft size={16} aria-hidden="true" />
                            Back to the sandbox
                        </button>
                        <span className="sb-about-escape" aria-hidden="true">Esc to close</span>
                    </footer>
                </dialog>,
                document.body,
            )}
        </>
    )
}
