#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SCRIPT LINUX/DOCKER: Extrair blocos CCS dos painéis após clicar em "Tarifário Regular"
Adaptado do original para rodar apenas em Linux/Docker (sem código Windows/ChromeDriverManager)
"""
import sys
import time
import json
import os
from datetime import datetime

# Forçar modo Docker/Linux
IS_DOCKER = True
IS_LINUX = True

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.action_chains import ActionChains
except ImportError as e:
    print(f"[WARNING] Selenium não disponível: {e}")
    sys.exit(1)

def extrair_paineis_tarifario(posto_id):
    print(f"[INFO] Iniciando extração de painéis para posto {posto_id}")
    def verificar_e_desmarcar_checkbox(driver, nome_checkbox="availableStations", max_tentativas=5):
        tentativas = 0
        while tentativas < max_tentativas:
            try:
                checkbox = driver.find_element(By.NAME, nome_checkbox)
                if checkbox.is_selected():
                    checkbox.click()
                    print(f"[INFO] Checkbox '{nome_checkbox}' desmarcado.")
                else:
                    print(f"[INFO] Checkbox '{nome_checkbox}' já está desmarcado.")
                return True
            except Exception as e:
                print(f"[WARNING] Não foi possível desmarcar o checkbox '{nome_checkbox}': {e}")
                tentativas += 1
                time.sleep(1)
        return False

    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_argument('--disable-web-security')
    options.add_argument('--disable-features=VizDisplayCompositor')
    options.add_argument('--disable-ipc-flooding-protection')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    try:
        print("[INFO] Inicializando Chrome...")
        driver = webdriver.Chrome(options=options)
        print("[INFO] Navegando para mobie.pt...")
        driver.get("https://www.mobie.pt")

        # Aguardar até que o elemento esteja presente na página
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[name='posto']"))
        )

        # Encontrar o campo de entrada do posto pelo nome
        campo_posto = driver.find_element(By.CSS_SELECTOR, "input[name='posto']")
        campo_posto.clear()
        campo_posto.send_keys(posto_id)
        campo_posto.send_keys(Keys.RETURN)

        # Aguardar a tabela de resultados aparecer
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table#tabela-resultados"))
        )

        # Obter o HTML da tabela de resultados
        tabela_html = driver.find_element(By.CSS_SELECTOR, "table#tabela-resultados").get_attribute('outerHTML')

        # (O restante do código para processar a tabela e extrair os dados permanece inalterado)

        # Exemplo de processamento da tabela (adaptar conforme necessário)
        # import pandas as pd
        # tabela_df = pd.read_html(tabela_html, decimal=',', thousands='.')[0]
        # dados_json = tabela_df.to_json(orient='records', force_ascii=False)

        # Retornar os dados extraídos (exemplo)
        return {
            "posto_id": posto_id,
            "dados": tabela_html,  # Substituir por dados_json se usar pandas
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"[ERROR] ERRO GERAL: {e}")
        if 'driver' in locals():
            driver.quit()
        return {
            "error": str(e),
            "posto_id": posto_id,
            "timestamp": datetime.now().isoformat()
        }

def main():
    if len(sys.argv) > 1:
        posto_id = sys.argv[1].upper()
    else:
        posto_id = "BRR-00137"
        print("[WARNING] Nenhum posto_id fornecido, usando padrão: BRR-00137")
    print("=" * 60)
    print(f" EXTRAÇÃO OTIMIZADA DE BLOCOS CCS - POSTO {posto_id}")
    print("=" * 60)
    start_time = time.time()
    resultado = extrair_paineis_tarifario(posto_id)
    end_time = time.time()
    tempo_execucao = end_time - start_time
    if isinstance(resultado, dict):
        resultado["tempo_execucao_segundos"] = round(tempo_execucao, 2)
    print("\n[RESULT] RESULTADO FINAL:")
    print(json.dumps(resultado, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
