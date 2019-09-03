import { js2xml } from 'xml-js';

type TContentType = 'html' | 'xhtml' | 'text';

interface ITextConstruct {
    type?: TContentType;
    value: string;
}

type TContent = ITextConstruct & {
    type?: string;
    src?: string;
};
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
    value: string;
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

interface IAtomSource {
    author: IPerson[];
    category?: ICategory[];
    contributor?: IPerson[];
    generator?: IGenerator;
    icon?: string;
    id: string;
    link?: ILink[];
    logo?: string;
    rights?: ITextConstruct;
    subtitle?: ITextConstruct;
    title: ITextConstruct;
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
    rights?: ITextConstruct;
    subtitle?: ITextConstruct;
    title: ITextConstruct;
    updated: string; // ISO
    // extensionElement: any;
}

interface IAtomEntry {
    author: IPerson[];
    category?: ICategory[];
    content: TContent;
    contributor?: IPerson[];
    id: string;
    link?: ILink[];
    published?: string; // ISO
    rights?: ITextConstruct;
    source?: IAtomSource;
    summary?: ITextConstruct;
    title: ITextConstruct;
    updated: string; // ISO
    // extensionElement: any;
}

//

interface ISourceData extends Omit<IAtomSource, 'updated'> {
    updated?: Date;
}

interface IFeedInput extends Omit<IAtomFeed, 'updated'> {
    updated?: Date;
}

interface IEntryInput extends Omit<IAtomEntry, 'published' | 'updated' | 'source'> {
    published?: Date;
    updated?: Date;
    source?: ISourceData;
}

type TContentTypeField = {
    _attributes: { type?: TContentType };
    _text: string;
}

type IFeed = {
    author: IPerson[];
    category?: ICategory[];
    contributor?: IPerson[];
    generator: {
        _attributes: Omit<IGenerator, 'value'>;
        _text: string;
    };
    icon?: string;
    logo?: string;
    id: string;
    link?: Array<{ _attributes: ILink }>;
    rights?: TContentTypeField;
    subtitle?: TContentTypeField;
    title?: TContentTypeField;
    updated: string;
};
type ISource = IFeed;
type IEntry = {
    author: IPerson[];
    category?: ICategory[];
    content: {
        _attributes: {
            type?: TContentType | string;
            src?: string;
        };
        _text?: string;
    };
    contributor?: IPerson[];
    id: string;
    link?: Array<{ _attributes: ILink }>;
    published?: string;
    rights?: TContentTypeField;
    source?: ISource;
    summary?: TContentTypeField;
    title: TContentTypeField;
    updated: string;
};

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

const ifTextExist = <A>(_text: string | undefined, _attributes: A) => (
    !_text ? undefined : { _attributes, _text }
);

const ifExist = <T>(data: T | false) => data || undefined;

export default class Feed {
    private readonly feed: IFeed;

    private entries: IEntry[] = [];

    private parseFeed = (data: IFeedInput) => {
        const feed: IFeed = {
            author: data.author.map(a => removeEmptyProperties({
                name: a.name,
                email: a.email,
                uri: a.uri,
            })),
            category: ifExist(data.category && data.category.map(c => removeEmptyProperties({
                term: c.term,
                scheme: c.scheme,
                label: c.label,
            }))),
            contributor: ifExist(data.contributor && data.contributor.map(c => removeEmptyProperties({
                name: c.name,
                email: c.email,
                uri: c.uri,
            }))),
            generator: data.generator
                ? {
                    _attributes: {
                        uri: data.generator.uri,
                        version: data.generator.version,
                    },
                    _text: data.generator.value,
                }
                : {
                    _attributes: {
                        uri: 'https://github.com/thermarthae/atom-feed',
                    },
                    _text: 'AtomFeed',
                },
            icon: data.icon,
            logo: data.logo,
            id: data.id,
            link: ifExist(data.link && data.link.map(l => ({
                _attributes: {
                    href: l.href,
                    rel: l.rel,
                    type: l.type,
                    hreflang: l.hreflang,
                    title: l.title,
                    length: l.length,
                },
            }))),
            rights: ifExist(data.rights && ifTextExist(data.rights.value, {
                type: data.rights.type,
            })),
            subtitle: ifExist(data.subtitle && ifTextExist(data.subtitle.value, {
                type: data.subtitle.type,
            })),
            title: ifExist(data.title && ifTextExist(data.title.value, {
                type: data.title.type,
            })),
            updated: (data.updated instanceof Date ? data.updated : new Date()).toISOString(),
        };

        return removeEmptyProperties(feed);
    }

    private parseEntry = (data: IEntryInput) => {
        const entry: IEntry = removeEmptyProperties({
            author: data.author.map(a => removeEmptyProperties({
                name: a.name,
                email: a.email,
                uri: a.uri,
            })),
            category: ifExist(data.category && data.category.map(c => removeEmptyProperties({
                term: c.term,
                scheme: c.scheme,
                label: c.label,
            }))),
            content: {
                _attributes: {
                    type: data.content.type,
                    src: data.content.src,
                },
                _text: data.content.value,
            },
            contributor: ifExist(data.contributor && data.contributor.map(c => removeEmptyProperties({
                name: c.name,
                email: c.email,
                uri: c.uri,
            }))),
            id: data.id,
            link: ifExist(data.link && data.link.map(l => ({
                _attributes: {
                    href: l.href,
                    rel: l.rel,
                    type: l.type,
                    hreflang: l.hreflang,
                    title: l.title,
                    length: l.length,
                },
            }))),
            published: data.published instanceof Date ? data.published.toISOString() : undefined,
            rights: ifExist(data.rights && ifTextExist(data.rights.value, {
                type: data.rights.type,
            })),
            source: ifExist(data.source && this.parseFeed(data.source)),
            summary: ifExist(data.summary && ifTextExist(data.summary.value, {
                type: data.summary.type,
            })),
            title: {
                _attributes: {
                    type: data.title.type,
                },
                _text: data.title.value,
            },
            updated: (data.updated instanceof Date ? data.updated : new Date()).toISOString(),
        });

        return entry;
    }

    constructor(data: IFeedInput) {
        this.feed = this.parseFeed(data);
    }

    public addEntry = (data: IEntryInput) => {
        const entry = this.parseEntry(data);
        this.entries.push(entry);
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
