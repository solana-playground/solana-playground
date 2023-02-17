/** @group Models */
export declare type JsonMetadata<Uri = string> = {
    name?: string;
    symbol?: string;
    description?: string;
    seller_fee_basis_points?: number;
    image?: Uri;
    external_url?: Uri;
    attributes?: Array<{
        trait_type?: string;
        value?: string;
        [key: string]: unknown;
    }>;
    properties?: {
        creators?: Array<{
            address?: string;
            share?: number;
            [key: string]: unknown;
        }>;
        files?: Array<{
            type?: string;
            uri?: Uri;
            [key: string]: unknown;
        }>;
        [key: string]: unknown;
    };
    collection?: {
        name?: string;
        family?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};
