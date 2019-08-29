import { js2xml } from 'xml-js';

interface IPerson {
    name: string;
    uri?: string;
    email?: string;
}

interface ICategory {
    term: string;
    scheme?: string;
    label?: string;
}

interface IGenerator {
    content: string;
    uri?: string;
    version?: string;
}

interface ILink {
    href: string;
    rel?: string;
    type?: string;
    hreflang?: string;
    title?: string;
    length?: string;
}

interface ISource {
    author: IPerson[];
    category?: ICategory[];
    contributor?: IPerson[];
    generator?: IGenerator;
    icon?: string;
    id: string;
    link?: ILink[];
    logo?: string;
    rights?: string;
    subtitle?: string;
    title: string;
    updated: string; // ISO
    // extensionElement: any;
}

interface IAtomFeed {
    author: IPerson[];
    category?: ICategory[];
    contributor?: IPerson[];
    generator?: IGenerator;
    icon?: string;
    logo?: string;
    id: string;
    link?: ILink[];
    rights?: string;
    subtitle?: string;
    title: string;
    updated: string; // ISO
    // extensionElement: any;
}

interface IAtomEntry {
    author: IPerson[];
    category?: ICategory[];
    content: string;
    contributor?: IPerson[];
    id: string;
    link?: ILink[];
    published?: string; // ISO
    rights?: string;
    atomSource?: ISource;
    summary?: string;
    title: string;
    updated: string; // ISO
    // extensionElement: any;
}

//

interface IFeedData extends Omit<IAtomFeed, 'updated'> {
    updated?: Date;
}

interface IEntryData extends Omit<IAtomEntry, 'published' | 'updated'> {
    published?: Date;
    updated?: Date;
}

interface IAttribLink {
    link: Array<{ _attributes: ILink }>;
}

const removeEmptyProperties = <T = IAtomFeed | IAtomEntry>(obj: T) => {
    const newObj: any = {};
    Object.keys(obj).forEach((key) => {
        const value = (obj as any)[key];
        if (value !== null && value !== undefined) {
            newObj[key] = value;
        }
    });
    return newObj as T;
};

type IFeed = Omit<IAtomFeed, 'link'> & IAttribLink;
type IEntry = Omit<IAtomEntry, 'link'> & IAttribLink;

export default class Feed {
    private readonly feed: IFeed;

    private entries: IEntry[] = [];

    constructor(feedData: IFeedData) {
        const {
            author,
            category,
            contributor,
            generator = {
                content: 'AtomFeed',
                uri: 'https://github.com/thermarthae/atom-feed',
            },
            icon,
            logo,
            id,
            link = [],
            rights,
            subtitle,
            title,
            updated = new Date(),
        } = feedData;

        const feed: IFeed = {
            author,
            category,
            contributor,
            generator,
            icon,
            logo,
            id,
            link: link.map(_attributes => ({ _attributes })),
            rights,
            subtitle,
            title,
            updated: updated.toISOString(),
        };

        this.feed = removeEmptyProperties(feed);
    }

    public addEntry = (entryData: IEntryData) => {
        const {
            author,
            category,
            content,
            contributor,
            id,
            link = [],
            published,
            rights,
            atomSource,
            summary,
            title,
            updated = new Date(),
        } = entryData;

        const entry: IEntry = removeEmptyProperties({
            author,
            category,
            content,
            contributor,
            id,
            link: link.map(_attributes => ({ _attributes })),
            published: published ? published.toISOString() : undefined,
            rights,
            atomSource,
            summary,
            title,
            updated: updated.toISOString(),
        });

        return this.entries.push(entry);
    };

    public getFeed = (indent?: string | number): string => js2xml(
        {
            _declaration: {
                _attributes: {
                    version: '1.0',
                    encoding: 'utf-8',
                },
            },
            feed: {
                ...this.feed,
                _attributes: {
                    xmlns: 'http://www.w3.org/2005/Atom',
                },
                entry: this.entries,
            },
        },
        {
            compact: true,
            spaces: indent,
        },
    );
}
