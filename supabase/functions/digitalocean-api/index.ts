import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DO_API_BASE = 'https://api.digitalocean.com/v2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const doToken = Deno.env.get('DIGITALOCEAN_API_TOKEN');
    if (!doToken) {
      throw new Error('DigitalOcean API token not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data } = await req.json();
    console.log(`DigitalOcean API action: ${action}`, data);

    let result;

    switch (action) {
      // ==================== ACCOUNT ====================
      case 'get_account':
        result = await doRequest(doToken, 'GET', '/account');
        break;

      case 'get_balance':
        result = await doRequest(doToken, 'GET', '/customers/my/balance');
        break;

      // ==================== REGIONS ====================
      case 'get_regions':
        result = await doRequest(doToken, 'GET', '/regions');
        break;

      // ==================== SIZES ====================
      case 'get_sizes':
        result = await doRequest(doToken, 'GET', '/sizes');
        break;

      // ==================== IMAGES ====================
      case 'get_images':
        const imageType = data?.type || 'distribution';
        result = await doRequest(doToken, 'GET', `/images?type=${imageType}`);
        break;

      // ==================== DROPLETS (VPS) ====================
      case 'create_droplet':
        result = await doRequest(doToken, 'POST', '/droplets', {
          name: data.name,
          region: data.region,
          size: data.size,
          image: data.image,
          ssh_keys: data.ssh_keys || [],
          backups: data.backups || false,
          ipv6: data.ipv6 || true,
          monitoring: data.monitoring || true,
          tags: data.tags || ['ashholding']
        });
        
        if (result.droplet) {
          await logOperation(supabase, data.order_id, 'create_droplet', data, result, 'success');
        }
        break;

      case 'get_droplet':
        result = await doRequest(doToken, 'GET', `/droplets/${data.droplet_id}`);
        break;

      case 'list_droplets':
        result = await doRequest(doToken, 'GET', '/droplets?tag_name=ashholding');
        break;

      case 'delete_droplet':
        result = await doRequest(doToken, 'DELETE', `/droplets/${data.droplet_id}`);
        await logOperation(supabase, data.order_id, 'delete_droplet', data, result, 'success');
        break;

      case 'droplet_action':
        result = await doRequest(doToken, 'POST', `/droplets/${data.droplet_id}/actions`, {
          type: data.action_type // power_on, power_off, reboot, etc.
        });
        break;

      // ==================== DATABASES ====================
      case 'create_database':
        result = await doRequest(doToken, 'POST', '/databases', {
          name: data.name,
          engine: data.engine, // pg, mysql, redis, mongodb
          version: data.version,
          size: data.size,
          region: data.region,
          num_nodes: data.num_nodes || 1,
          tags: ['ashholding']
        });
        
        if (result.database) {
          await logOperation(supabase, data.order_id, 'create_database', data, result, 'success');
        }
        break;

      case 'get_database':
        result = await doRequest(doToken, 'GET', `/databases/${data.database_id}`);
        break;

      case 'list_databases':
        result = await doRequest(doToken, 'GET', '/databases');
        break;

      case 'delete_database':
        result = await doRequest(doToken, 'DELETE', `/databases/${data.database_id}`);
        await logOperation(supabase, data.order_id, 'delete_database', data, result, 'success');
        break;

      // ==================== SPACES (OBJECT STORAGE) ====================
      case 'list_spaces_regions':
        result = await doRequest(doToken, 'GET', '/regions?features=spaces');
        break;

      // ==================== LOAD BALANCERS ====================
      case 'create_load_balancer':
        result = await doRequest(doToken, 'POST', '/load_balancers', {
          name: data.name,
          region: data.region,
          size: data.size || 'lb-small',
          algorithm: data.algorithm || 'round_robin',
          forwarding_rules: data.forwarding_rules || [{
            entry_protocol: 'http',
            entry_port: 80,
            target_protocol: 'http',
            target_port: 80
          }],
          health_check: data.health_check || {
            protocol: 'http',
            port: 80,
            path: '/',
            check_interval_seconds: 10,
            response_timeout_seconds: 5,
            healthy_threshold: 3,
            unhealthy_threshold: 3
          },
          droplet_ids: data.droplet_ids || [],
          tag: 'ashholding'
        });
        
        if (result.load_balancer) {
          await logOperation(supabase, data.order_id, 'create_load_balancer', data, result, 'success');
        }
        break;

      case 'list_load_balancers':
        result = await doRequest(doToken, 'GET', '/load_balancers');
        break;

      case 'delete_load_balancer':
        result = await doRequest(doToken, 'DELETE', `/load_balancers/${data.load_balancer_id}`);
        break;

      // ==================== KUBERNETES ====================
      case 'create_kubernetes_cluster':
        result = await doRequest(doToken, 'POST', '/kubernetes/clusters', {
          name: data.name,
          region: data.region,
          version: data.version || 'latest',
          node_pools: [{
            name: `${data.name}-pool`,
            size: data.node_size || 's-2vcpu-4gb',
            count: data.node_count || 1,
            tags: ['ashholding']
          }],
          tags: ['ashholding']
        });
        
        if (result.kubernetes_cluster) {
          await logOperation(supabase, data.order_id, 'create_kubernetes_cluster', data, result, 'success');
        }
        break;

      case 'list_kubernetes_clusters':
        result = await doRequest(doToken, 'GET', '/kubernetes/clusters');
        break;

      case 'delete_kubernetes_cluster':
        result = await doRequest(doToken, 'DELETE', `/kubernetes/clusters/${data.cluster_id}`);
        break;

      // ==================== FIREWALLS ====================
      case 'create_firewall':
        result = await doRequest(doToken, 'POST', '/firewalls', {
          name: data.name,
          inbound_rules: data.inbound_rules || [
            { protocol: 'tcp', ports: '22', sources: { addresses: ['0.0.0.0/0'] } },
            { protocol: 'tcp', ports: '80', sources: { addresses: ['0.0.0.0/0'] } },
            { protocol: 'tcp', ports: '443', sources: { addresses: ['0.0.0.0/0'] } }
          ],
          outbound_rules: data.outbound_rules || [
            { protocol: 'tcp', ports: 'all', destinations: { addresses: ['0.0.0.0/0'] } },
            { protocol: 'udp', ports: 'all', destinations: { addresses: ['0.0.0.0/0'] } }
          ],
          droplet_ids: data.droplet_ids || [],
          tags: ['ashholding']
        });
        break;

      case 'list_firewalls':
        result = await doRequest(doToken, 'GET', '/firewalls');
        break;

      // ==================== SNAPSHOTS ====================
      case 'create_snapshot':
        result = await doRequest(doToken, 'POST', `/droplets/${data.droplet_id}/actions`, {
          type: 'snapshot',
          name: data.name
        });
        break;

      case 'list_snapshots':
        result = await doRequest(doToken, 'GET', '/snapshots?resource_type=droplet');
        break;

      // ==================== SSH KEYS ====================
      case 'list_ssh_keys':
        result = await doRequest(doToken, 'GET', '/account/keys');
        break;

      case 'create_ssh_key':
        result = await doRequest(doToken, 'POST', '/account/keys', {
          name: data.name,
          public_key: data.public_key
        });
        break;

      // ==================== DOMAINS (DNS) ====================
      case 'list_domains':
        result = await doRequest(doToken, 'GET', '/domains');
        break;

      case 'create_domain':
        result = await doRequest(doToken, 'POST', '/domains', {
          name: data.name,
          ip_address: data.ip_address
        });
        break;

      case 'create_domain_record':
        result = await doRequest(doToken, 'POST', `/domains/${data.domain_name}/records`, {
          type: data.type,
          name: data.record_name,
          data: data.record_data,
          ttl: data.ttl || 3600
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('DigitalOcean API error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function doRequest(token: string, method: string, endpoint: string, body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${DO_API_BASE}${endpoint}`, options);
  
  if (method === 'DELETE' && response.status === 204) {
    return { deleted: true };
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `DigitalOcean API error: ${response.status}`);
  }

  return data;
}

async function logOperation(
  supabase: any,
  orderId: string | undefined,
  operationType: string,
  requestPayload: any,
  responsePayload: any,
  status: string,
  errorMessage?: string
) {
  if (!orderId) return;
  
  try {
    await supabase.from('hosting_operations_log').insert({
      order_id: orderId,
      operation_type: operationType,
      request_payload: requestPayload,
      response_payload: responsePayload,
      status,
      error_message: errorMessage
    });
  } catch (e) {
    console.error('Failed to log operation:', e);
  }
}
