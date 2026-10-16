import assert from "node:assert/strict";
import test from "node:test";
import { createCobaltEinVerificationProvider, createMockEinVerificationProvider, EinLiveLookupDisabledError, EinProviderNotConfiguredError, getEinVerificationProvider, mapCobaltTinResponse } from "../src/services/ein-verification-provider.js";

const credential="unit-test-credential",input={ein:"123456789",legalName:"Example Legal LLC"};
const response=(body:unknown,status=200):Response=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json"}});

test("mock test mode performs no network request",async()=>{
    let calls=0;const original=globalThis.fetch;globalThis.fetch=(async()=>{calls+=1;throw new Error("network must not be called");}) as typeof fetch;
    try{const result=await createMockEinVerificationProvider().verifyEin(input);assert.equal(result.status,"match");assert.equal(calls,0);assert.equal(getEinVerificationProvider("mock",{liveEnabled:false}).name,"mock_tin");}finally{globalThis.fetch=original;}
});

test("live request follows the documented endpoint and has no test parameter",async()=>{
    let capturedUrl:URL|undefined,capturedInit:RequestInit|undefined;
    const provider=createCobaltEinVerificationProvider({apiKey:credential,liveEnabled:true,fetch:(async(url,init)=>{capturedUrl=new URL(String(url));capturedInit=init;return response({status:"TIN Matched",irsCode:0});}) as typeof fetch});
    assert.equal((await provider.verifyEin(input)).status,"match");
    assert.equal(capturedUrl?.origin+capturedUrl?.pathname,"https://apigateway.cobaltintelligence.com/tinVerification");
    assert.deepEqual([...capturedUrl!.searchParams.keys()].sort(),["businessName","tin"]);
    assert.equal(capturedUrl?.searchParams.has("test"),false);
    assert.equal(new Headers(capturedInit?.headers).get("Accept"),"application/json");
    assert.equal(new Headers(capturedInit?.headers).get("x-api-key"),credential);
});

test("Cobalt responses map conservatively and never auto-approve",()=>{
    assert.equal(mapCobaltTinResponse({status:"TIN Matched",irsCode:0}).status,"match");
    assert.equal(mapCobaltTinResponse({status:"Did Not Match",irsCode:0}).status,"invalid_response");
    const expected=new Map([[1,"invalid_tin"],[2,"tin_not_issued"],[3,"name_mismatch"],[4,"invalid_request"],[5,"reuse_existing"],[6,"manual_review"],[7,"manual_review"],[8,"manual_review"]]);
    for(const [code,status] of expected)assert.equal(mapCobaltTinResponse({status:"Did Not Match",irsCode:code}).status,status);
    for(const status of ["Pending","In Review"])assert.equal(mapCobaltTinResponse({status,irsCode:0}).status,"pending");
    assert.equal(mapCobaltTinResponse({irsCode:0,irsServiceStatus:"THE IRS TIN MATCHING SERVICE IS SLOW OR CURRENTLY EXPERIENCING AN OUTAGE"}).status,"unavailable");
});

test("missing credentials and disabled live mode fail closed",()=>{
    assert.throws(()=>createCobaltEinVerificationProvider({liveEnabled:true}),EinProviderNotConfiguredError);
    assert.throws(()=>createCobaltEinVerificationProvider({apiKey:credential,liveEnabled:false}),EinLiveLookupDisabledError);
});

test("provider failures are retryable and sanitized",async()=>{
    for(const fetchImpl of [(async()=>{throw new Error(`network ${input.ein} ${credential}`);}) as typeof fetch,(async()=>response({secret:credential,tin:input.ein},503)) as typeof fetch]){
        const result=await createCobaltEinVerificationProvider({apiKey:credential,liveEnabled:true,fetch:fetchImpl}).verifyEin(input);
        assert.equal(result.status,"unavailable");assert.doesNotMatch(JSON.stringify(result),new RegExp(`${input.ein}|${credential}`));
    }
});
