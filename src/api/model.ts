export interface EventRoleType {
    _class: string;
    string: string;
}

export interface EventRef {
    _class: string;
    private: boolean;
    citation_list: string[];
    note_list: string[];
    attribute_list: string[];
    ref: string;
    role: EventRoleType;
}


export interface AttributeType {
    _class: string;
    string: string;
}


interface Attribute {
    _class: string;
    private: boolean;
    type: AttributeType;
    value: string;
    citation_list: any[];
    note_list: any[];
}

interface ChildRefType {
    _class: string; // Class type
    string: string; // Relation description
}

// Define the main interface for the child reference
interface ChildRef {
    _class: string; // Class type of ChildRef
    private: boolean; // Private flag
    citation_list: any[]; // Array for citation list (type can be specified if known)
    note_list: any[]; // Array for note list (type can be specified if known)
    ref: string; // Reference identifier
    frel: ChildRefType; // Relation type (frel)
    mrel: ChildRefType; // Relation type (mrel)
}

export interface FamilyRelType {
    _class: string;
    string: string;
}

export interface Family {
    _class: string;                          
    handle: string;                          
    change: number;                          
    private: boolean;                        
    tag_list: string[];                      
    gramps_id: string;                       
    citation_list: string[];                 
    note_list: string[];                     
    media_list: MediaRef[];                    
    attribute_list: string[];                
    lds_ord_list: string[];                  
    father_handle: string;                   
    mother_handle: string;                   
    child_ref_list: ChildRef[];                
    type: FamilyRelType;                     
    event_ref_list: EventRef[];              
    complete: number;                        
}

interface NameOriginType {
    _class: string;
    string: string;
}

export interface Surname {
    _class: string;
    surname: string;
    prefix: string;
    primary: boolean;
    origintype: NameOriginType;
    connector: string;
}

interface NameType {
    _class: string;
    string: string;
}

export interface Name {
    _class: string;
    private: boolean;
    surname_list: Surname[];
    citation_list: any[];
    note_list: any[];
    date: Date | null;
    first_name: string;
    suffix: string;
    title: string;
    type: NameType;
    group_as: string;
    sort_as: number;
    display_as: number;
    call: string;
    nick: string;
    famnick: string;
}

export interface Person {
    _class: string;
    handle: string;
    change: number;
    private: boolean;
    tag_list: any[];
    gramps_id: string;
    citation_list: string[];
    note_list: any[];
    media_list: MediaRef[]
    attribute_list: Attribute[];
    address_list: any[];
    urls: any[];
    lds_ord_list: any[];
    primary_name: Name;
    event_ref_list: EventRef[];
    family_list: string[];
    parent_family_list: string[];
    alternate_names: any[];
    person_ref_list: any[];
    death_ref_index: number;
    birth_ref_index: number;
    gender: number;
}

export interface DateDetails {
    _class: string;
    format: string | null;
    calendar: number;
    modifier: number;
    quality: number;
    dateval: [number, number, number, boolean];
    text: string;
    sortval: number;
    newyear: number;
}


export interface EventType {
    _class: string;
    string: string;
}

export interface Event {
    _class: string;
    handle: string;
    change: number;
    private: boolean;
    tag_list: any[];
    gramps_id: string;
    citation_list: any[];
    note_list: any[];
    media_list: MediaRef[]
    attribute_list: Attribute[];
    date: DateDetails;
    place: string;
    type: EventType;
    description: string;
}



export interface MediaRef {
    _class: string;
    private: boolean;
    citation_list: any[];
    note_list: any[];
    ref: string;
    attribute_list: Attribute[];
    rect: number[];
}

export interface Media {
    _class: string;
    handle: string;
    change: number;
    private: boolean;
    tag_list: any[];
    gramps_id: string;
    citation_list: any[];
    note_list: any[];
    date: DateDetails;
    attribute_list: any[];
    path: string;
    mime: string;
    desc: string;
    checksum: string;
    thumb: string | null;
}