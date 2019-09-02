import { js2xml } from 'xml-js';

type TContentType = 'html' | 'xhtml' | 'text';
type TContent = ITextConstruct | { type?: string; src: string; value: never };

interface ITextConstruct {
    type?: TContentType;
    value: string;
}

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

interface ISource {
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
    atomSource?: ISource;
    summary?: ITextConstruct;
    title: ITextConstruct;
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

type TContentTypeField = {
    _attributes: { type?: TContentType };
    _text: string;
}

type IFeed = Readonly<{
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
    link: Array<{ _attributes: ILink }>;
    rights?: TContentTypeField;
    subtitle?: TContentTypeField;
    title?: TContentTypeField;
    updated: string;
}>;
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
    link: Array<{ _attributes: ILink }>;
    published?: string;
    rights?: TContentTypeField;
    atomSource?: ISource;
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

export default class Feed {
    private readonly feed: IFeed;

    private entries: IEntry[] = [];

    constructor(feedData: IFeedData) {
        const {
            author,
            category,
            contributor,
            generator: { value: generatorText, ...generatorAttribs } = {
                value: 'AtomFeed',
                uri: 'https://github.com/thermarthae/atom-feed',
            },
            icon,
            logo,
            id,
            link = [],
            rights: { value: rightsText, ...rightsAttribs } = {} as Partial<ITextConstruct>,
            subtitle: { value: subtitleText, ...subtitleAttribs } = {} as Partial<ITextConstruct>,
            title: { value: titleText, ...titleAttribs } = {} as Partial<ITextConstruct>,
            updated = new Date(),
        } = feedData;

        const feed: IFeed = {
            author,
            category,
            contributor,
            generator: {
                _attributes: generatorAttribs,
                _text: generatorText,
            },
            icon,
            logo,
            id,
            link: link.map(_attributes => ({ _attributes })),
            rights: ifTextExist(rightsText, rightsAttribs),
            subtitle: ifTextExist(subtitleText, subtitleAttribs),
            title: ifTextExist(titleText, titleAttribs),
            updated: updated.toISOString(),
        };

        this.feed = removeEmptyProperties(feed);
    }

    public addEntry = (entryData: IEntryData) => {
        const {
            author,
            category,
            content: { value: contentText, ...contentAttribs } = {} as Partial<TContent>,
            contributor,
            id,
            link = [],
            published,
            rights: { value: rightsText, ...rightsAttribs } = {} as Partial<ITextConstruct>,
            atomSource,
            summary: { value: summaryText, ...summaryAttribs } = {} as Partial<ITextConstruct>,
            title: { value: titleText, ...titleAttribs },
            updated = new Date(),
        } = entryData;

        const entry: IEntry = removeEmptyProperties({
            author,
            category,
            content: {
                _attributes: contentAttribs,
                _text: contentText,
            },
            contributor,
            id,
            link: link.map(_attributes => ({ _attributes })),
            published: published ? published.toISOString() : undefined,
            rights: ifTextExist(rightsText, rightsAttribs),
            atomSource,
            summary: ifTextExist(summaryText, summaryAttribs),
            title: {
                _attributes: titleAttribs,
                _text: titleText,
            },
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
