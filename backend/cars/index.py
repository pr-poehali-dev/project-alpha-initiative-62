import json
import urllib.request
import urllib.parse

def handler(event, context):
    """Проксирует запросы к NHTSA API: марки, модели и характеристики автомобилей"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', 'makes')
    year = params.get('year', '2023')
    make = params.get('make', '')
    model = params.get('model', '')

    base = 'https://vpic.nhtsa.dot.gov/api/vehicles'

    if action == 'makes':
        url = f'{base}/GetMakesForVehicleType/car?format=json'
        req = urllib.request.Request(url, headers={'User-Agent': 'AutoCompare/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        results = data.get('Results', [])
        makes = sorted(set(r['MakeName'] for r in results if r.get('MakeName')))
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'makes': makes})}

    elif action == 'models':
        encoded_make = urllib.parse.quote(make)
        url = f'{base}/GetModelsForMakeYear/make/{encoded_make}/modelyear/{year}?format=json'
        req = urllib.request.Request(url, headers={'User-Agent': 'AutoCompare/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        results = data.get('Results', [])
        models = sorted(set(r['Model_Name'] for r in results if r.get('Model_Name')))
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'models': models})}

    elif action == 'specs':
        encoded_make = urllib.parse.quote(make)
        encoded_model = urllib.parse.quote(model)
        url = f'{base}/GetModelsForMakeYear/make/{encoded_make}/modelyear/{year}/vehicleType/car?format=json'
        req = urllib.request.Request(url, headers={'User-Agent': 'AutoCompare/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        results = data.get('Results', [])

        # Ищем нужную модель среди результатов
        matched = next((r for r in results if r.get('Model_Name', '').lower() == model.lower()), results[0] if results else {})

        # Дополнительно получаем детальные характеристики через DecodeModelVariantResults
        make_id = matched.get('Make_ID', '')
        model_id = matched.get('Model_ID', '')

        specs = {
            'make': make,
            'model': model,
            'year': year,
            'makeId': str(make_id),
            'modelId': str(model_id),
        }

        # Получаем характеристики через GetVariableValuesList
        if make_id and model_id:
            variants_url = f'{base}/GetModelsForMakeIdYear/makeId/{make_id}/modelyear/{year}/vehicleType/car?format=json'
            try:
                req2 = urllib.request.Request(variants_url, headers={'User-Agent': 'AutoCompare/1.0'})
                with urllib.request.urlopen(req2, timeout=8) as resp2:
                    vdata = json.loads(resp2.read().decode())
                vresults = vdata.get('Results', [])
                vmatch = next((r for r in vresults if r.get('Model_ID') == model_id), {})
                if vmatch:
                    specs['bodyClass'] = vmatch.get('VehicleTypeName', '—')
            except Exception:
                pass

        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'specs': specs})}

    return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Unknown action'})}
