export interface EinVerificationProviderInput { ein: string; legalName: string; }
export type EinProviderStatus = "match" | "invalid_tin" | "tin_not_issued" | "name_mismatch" | "invalid_request" | "reuse_existing" | "pending" | "manual_review" | "unavailable" | "invalid_response";
export interface EinVerificationProviderResult { providerReference: string | null; status: EinProviderStatus; responseCode: string | null; reason: string; }
export interface EinVerificationProvider { readonly name: string; verifyEin(input: EinVerificationProviderInput): Promise<EinVerificationProviderResult>; }

export class EinProviderNotConfiguredError extends Error { constructor() { super("EIN verification provider is not configured."); this.name = "EinProviderNotConfiguredError"; } }
export class EinLiveLookupDisabledError extends Error { constructor() { super("Live EIN verification is disabled."); this.name = "EinLiveLookupDisabledError"; } }

export type ProviderMode = "mock" | "live";
export type MockTinOutcome = "match" | "invalid_tin" | "tin_not_issued" | "name_mismatch" | "invalid_request" | "duplicate" | "manual_review_6" | "manual_review_7" | "manual_review_8" | "unavailable" | "pending" | "in_review";
type Fetch = typeof fetch;
interface CobaltProviderOptions { apiKey?: string | undefined; liveEnabled: boolean; fetch?: Fetch; timeoutMs?: number; }
const COBALT_TIN_ENDPOINT = "https://apigateway.cobaltintelligence.com/tinVerification";
const safeText = (value: unknown, maxLength = 160): string | null => typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
const safeReference = (body: Record<string, unknown>): string | null => safeText(body.requestId ?? body.requestID ?? body.providerReference ?? body.searchGuid, 200);
const serviceUnavailable = (value: unknown): boolean => { const normalized = typeof value === "string" ? value.toUpperCase() : ""; return normalized.includes("UNAVAILABLE") || normalized.includes("OUTAGE") || normalized.includes("SLOW"); };

export const mapCobaltTinResponse = (value: unknown): EinVerificationProviderResult => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return { providerReference:null,status:"invalid_response",responseCode:null,reason:"The provider returned an invalid response." };
    const body=value as Record<string,unknown>,providerReference=safeReference(body),providerStatus=safeText(body.status)?.toLowerCase();
    const irsCode=typeof body.irsCode === "number" && Number.isInteger(body.irsCode) ? body.irsCode : null;
    const responseCode=irsCode === null ? null : String(irsCode);
    if (serviceUnavailable(body.irsServiceStatus)) return { providerReference,status:"unavailable",responseCode,reason:"IRS verification is temporarily unavailable. Retry later." };
    if (providerStatus === "pending" || providerStatus === "in review") return { providerReference,status:"pending",responseCode,reason:"The IRS verification remains pending." };
    if (providerStatus === "tin matched" && irsCode === 0) return { providerReference,status:"match",responseCode:"0",reason:"The provider reports that the legal name and EIN match. Administrator approval is still required." };
    if (irsCode === 1) return { providerReference,status:"invalid_tin",responseCode:"1",reason:"The provider reports an invalid EIN. Request correction." };
    if (irsCode === 2) return { providerReference,status:"tin_not_issued",responseCode:"2",reason:"The provider reports that the EIN has not been issued." };
    if (irsCode === 3) return { providerReference,status:"name_mismatch",responseCode:"3",reason:"The legal business name does not match IRS records." };
    if (irsCode === 4) return { providerReference,status:"invalid_request",responseCode:"4",reason:"The provider rejected the request as invalid. Do not retry automatically." };
    if (irsCode === 5) return { providerReference,status:"reuse_existing",responseCode:"5",reason:"Reuse the existing verification result through idempotency handling." };
    if (irsCode === 6 || irsCode === 7 || irsCode === 8) return { providerReference,status:"manual_review",responseCode:String(irsCode),reason:"Manual review is required until the provider confirms this code is acceptable for business EIN verification." };
    return { providerReference,status:"invalid_response",responseCode,reason:"The provider returned an invalid response." };
};

const mockResponses: Record<MockTinOutcome, Record<string, unknown>> = {
    match:{status:"TIN Matched",irsCode:0},invalid_tin:{status:"Did Not Match",irsCode:1},tin_not_issued:{status:"Did Not Match",irsCode:2},name_mismatch:{status:"Did Not Match",irsCode:3},invalid_request:{status:"Did Not Match",irsCode:4},duplicate:{status:"Did Not Match",irsCode:5},manual_review_6:{status:"Did Not Match",irsCode:6},manual_review_7:{status:"Did Not Match",irsCode:7},manual_review_8:{status:"Did Not Match",irsCode:8},unavailable:{irsServiceStatus:"IRS SERVICE UNAVAILABLE"},pending:{status:"Pending"},in_review:{status:"In Review"}
};
export const createMockEinVerificationProvider = (outcome:MockTinOutcome="match"): EinVerificationProvider => ({
    name:"mock_tin",
    async verifyEin() { return {...mapCobaltTinResponse(mockResponses[outcome]),providerReference:`mock-${outcome}`}; }
});

export const createCobaltEinVerificationProvider = (options:CobaltProviderOptions):EinVerificationProvider => {
    if (!options.apiKey) throw new EinProviderNotConfiguredError();
    if (!options.liveEnabled) throw new EinLiveLookupDisabledError();
    const request=options.fetch??fetch,timeoutMs=options.timeoutMs??8_000;
    return { name:"cobalt_tin",async verifyEin(input){
        const url=new URL(COBALT_TIN_ENDPOINT);url.searchParams.set("tin",input.ein);url.searchParams.set("businessName",input.legalName);
        let response:Response;
        try { response=await request(url,{method:"GET",headers:{Accept:"application/json","x-api-key":options.apiKey!},signal:AbortSignal.timeout(timeoutMs)}); }
        catch { return {providerReference:null,status:"unavailable",responseCode:null,reason:"IRS verification is temporarily unavailable. Retry later."}; }
        if(!response.ok)return{providerReference:response.headers.get("x-request-id")?.slice(0,200)??null,status:"unavailable",responseCode:String(response.status),reason:"IRS verification is temporarily unavailable. Retry later."};
        try{return mapCobaltTinResponse(await response.json());}catch{return{providerReference:response.headers.get("x-request-id")?.slice(0,200)??null,status:"invalid_response",responseCode:null,reason:"The provider returned an invalid response."};}
    }};
};

export const getEinVerificationProvider=(mode:ProviderMode,config:{apiKey?:string|undefined;liveEnabled:boolean},mockOutcome?:MockTinOutcome):EinVerificationProvider => mode === "mock" ? createMockEinVerificationProvider(mockOutcome) : createCobaltEinVerificationProvider(config);
