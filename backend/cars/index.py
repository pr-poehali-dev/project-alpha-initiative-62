import json
import urllib.request
import urllib.parse

def handler(event, context):
    """Проксирует запросы к NHTSA API для получения данных об автомобилях"""
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
    elif action == 'models':
        encoded_make = urllib.parse.quote(make)
        url = f'{base}/GetModelsForMakeYear/make/{encoded_make}/modelyear/{year}?format=json'
    elif action == 'specs':
        encoded_make = urllib.parse.quote(make)
        encoded_model = urllib.parse.quote(model)
        url = f'{base}/GetModelsForMakeYear/make/{encoded_make}/modelyear/{year}?format=json'
    else:
        return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Unknown action'})}

    req = urllib.request.Request(url, headers={'User-Agent': 'AutoCompare/1.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())

    results = data.get('Results', [])

    if action == 'makes':
        popular = ['Toyota', 'BMW', 'Mercedes-Benz', 'Audi', 'Ford', 'Chevrolet', 'Honda', 'Hyundai', 'Kia', 'Volkswagen', 'Nissan', 'Mazda', 'Subaru', 'Lexus', 'Porsche']
        makes = [r['MakeName'] for r in results if r.get('MakeName') in popular]
        makes = sorted(set(makes), key=lambda x: popular.index(x) if x in popular else 99)
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'makes': makes})}

    if action == 'models':
        models = sorted(set(r['Model_Name'] for r in results if r.get('Model_Name')))
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'models': models})}

    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'results': results})}
