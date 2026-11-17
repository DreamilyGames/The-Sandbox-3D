export interface SBCreatorLink {
    label: string
    href?: string
    kind: 'github' | 'linkedin' | 'email' | 'website'
}

export interface SBCreatorProfile {
    name: string
    role: string
    location: string
    bio: readonly string[]
    projectName: string
    projectDescription: string
    projectSourceUrl?: string
    links: readonly SBCreatorLink[]
}

// Add only destinations that are intended to be public. Links without an href
// are omitted by the dialog; no account email or social handle is inferred.
export const sbCreatorProfile: SBCreatorProfile = {
    name: 'Chun Yan NGAMCHAIWASANA',
    role: 'Software/Web Developer',
    location: 'Hong Kong',
    bio: [
        'I design and build interactive web experiences, software, and games. I enjoy turning creative ideas into things people can explore and use. I also make music.',
    ],
    projectName: 'The Sandbox 3D',
    projectDescription:
        'I\'m building this to explore 3D interaction in the browser. It\'s a hands-on project where I bring interface design and development together, from viewing models to experimenting with materials and transforms.',
    projectSourceUrl: 'https://github.com/DreamilyGames/The-Sandbox-3D',
    links: [
        {
            label: 'View my GitHub',
            href: 'https://github.com/DreamilyGames',
            kind: 'github',
        },
    ],
}
