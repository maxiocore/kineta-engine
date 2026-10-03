INSERT INTO public.cloud_resource_mappings (kind, code, provider_id, provider_ref)
SELECT 'image', v.code, '97392771-2ea7-437e-8a3d-faa00e7ec76e'::uuid, v.ref
FROM (VALUES ('ubuntu-24.04','ubuntu-24.04'),('ubuntu-22.04','ubuntu-22.04'),('debian-12','debian-12'),('rocky-9','rocky-9'),('alma-9','alma-9')) AS v(code, ref)
WHERE NOT EXISTS (SELECT 1 FROM public.cloud_resource_mappings m WHERE m.kind='image' AND m.code=v.code AND m.provider_id='97392771-2ea7-437e-8a3d-faa00e7ec76e'::uuid);