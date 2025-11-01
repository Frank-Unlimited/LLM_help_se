"""
API测试脚本
用于测试后端接口是否正常工作
"""
import requests
import json

BASE_URL = "http://localhost:3000"


def test_health():
    """测试健康检查"""
    print("\n=== 测试健康检查 ===")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    return response.status_code == 200


def test_generate_trip():
    """测试生成行程"""
    print("\n=== 测试生成行程 ===")
    
    data = {
        "requirementsText": "我想去日本东京，5天，预算1万元，喜欢美食和动漫，带一个5岁孩子。",
        "preferences": ["food", "family", "plane", "comfortable"],
        "travelType": ["food", "family"],
        "transportPreference": ["plane"],
        "accommodationType": ["comfortable"],
        "currency": "CNY"
    }
    
    response = requests.post(f"{BASE_URL}/api/trips/generate", json=data)
    print(f"状态码: {response.status_code}")
    result = response.json()
    print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
    
    if response.status_code == 200:
        return result.get("tripId")
    return None


def test_get_trip_detail(trip_id):
    """测试获取行程详情"""
    print(f"\n=== 测试获取行程详情 (ID: {trip_id}) ===")
    
    response = requests.get(f"{BASE_URL}/api/trips/{trip_id}")
    print(f"状态码: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"行程名称: {result.get('tripName')}")
        print(f"目的地: {result.get('destination')}")
        print(f"天数: {result.get('totalDays')}")
        print(f"预算: {result.get('budget', {}).get('total')} {result.get('budget', {}).get('currency')}")
        print(f"行程天数: {len(result.get('itinerary', []))}")
    else:
        print(f"错误: {response.json()}")


def test_add_expense(trip_id):
    """测试记录开销"""
    print(f"\n=== 测试记录开销 (ID: {trip_id}) ===")
    
    data = {
        "amount": 1200,
        "category": "餐饮",
        "date": "2024-11-20",
        "description": "一兰拉面午餐"
    }
    
    response = requests.post(f"{BASE_URL}/api/trips/{trip_id}/expenses", json=data)
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")


def test_get_trips_list():
    """测试获取行程列表"""
    print("\n=== 测试获取行程列表 ===")
    
    response = requests.get(f"{BASE_URL}/api/trips?page=1&limit=10")
    print(f"状态码: {response.status_code}")
    result = response.json()
    print(f"总数: {result.get('total')}")
    print(f"当前页: {result.get('page')}")
    print(f"行程数: {len(result.get('trips', []))}")


def test_update_trip(trip_id):
    """测试更新行程"""
    print(f"\n=== 测试更新行程 (ID: {trip_id}) ===")
    
    data = {
        "tripName": "修改后的行程名称"
    }
    
    response = requests.put(f"{BASE_URL}/api/trips/{trip_id}", json=data)
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"新名称: {result.get('tripName')}")


def test_delete_trip(trip_id):
    """测试删除行程"""
    print(f"\n=== 测试删除行程 (ID: {trip_id}) ===")
    
    response = requests.delete(f"{BASE_URL}/api/trips/{trip_id}")
    print(f"状态码: {response.status_code}")
    print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")


def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("途智行API测试")
    print("=" * 60)
    
    try:
        # 1. 健康检查
        if not test_health():
            print("\n? 健康检查失败，请确保服务已启动")
            return
        
        # 2. 生成行程
        trip_id = test_generate_trip()
        if not trip_id:
            print("\n? 生成行程失败")
            return
        
        # 3. 获取详情
        test_get_trip_detail(trip_id)
        
        # 4. 记录开销
        test_add_expense(trip_id)
        
        # 5. 更新行程
        test_update_trip(trip_id)
        
        # 6. 获取列表
        test_get_trips_list()
        
        # 7. 删除行程
        test_delete_trip(trip_id)
        
        print("\n" + "=" * 60)
        print("? 所有测试完成")
        print("=" * 60)
        
    except requests.exceptions.ConnectionError:
        print("\n? 连接失败，请确保后端服务已启动 (http://localhost:3000)")
    except Exception as e:
        print(f"\n? 测试出错: {str(e)}")


if __name__ == "__main__":
    run_all_tests()

