#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
SCRIPT EXCLUSIVO: Extrair blocos CCS dos painéis após clicar em "Tarifário Regular"

Este script:
1. Navega até mobie.pt
2. Busca o posto especificado como argumento (ou brr-00137 por padrão)
3. Clica em "Tarifário Regular"
4. Extrai todos os blocos CCS encontrados nos painéis
5. Para cada painel, encontra "CABLE" seguido por "CCS" e extrai o texto de "CCS" até o próximo "CABLE" (não incluído)
6. Retorna JSON com posto ID e todos os blocos CCS encontrados

Uso: python extrair_paineis_tarifario.py [POSTO_ID]
Exemplo: python extrair_paineis_tarifario.py brr-00133
"""

import sys
import time
import json
from datetime import datetime

# Selenium imports
try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.common.action_chains import ActionChains
    from webdriver_manager.chrome import ChromeDriverManager
    SELENIUM_AVAILABLE = True
except ImportError as e:
    print(f"[WARNING] Selenium não disponível: {e}")
    sys.exit(1)


def extrair_paineis_tarifario(posto_id):
    """
    Extrair texto de painéis após clicar em "Tarifário Regular"
    """
    print(f"[INFO] Iniciando extração de painéis para posto {posto_id}")
    
    def verificar_e_desmarcar_checkbox(driver, nome_checkbox="availableStations", max_tentativas=5):
        """
        Função auxiliar para verificar e desmarcar checkbox de forma robusta
        Tenta múltiplas vezes até garantir que a checkbox está desmarcada
        """
        print(f"[DEBUG] Verificando estado da checkbox '{nome_checkbox}' (máx {max_tentativas} tentativas)...")
        
        for tentativa in range(1, max_tentativas + 1):
            try:
                print(f"[DEBUG] Tentativa {tentativa}/{max_tentativas}")
                
                # Aguardar a checkbox aparecer
                checkbox = WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.ID, nome_checkbox))
                )
                
                # Verificar se a checkbox está marcada
                if checkbox.is_selected():
                    print(f"[INFO] Checkbox '{nome_checkbox}' está marcada, desmarcando (tentativa {tentativa})...")
                    
                    # Tentar clique normal primeiro
                    try:
                        checkbox.click()
                        time.sleep(0.5)
                        print(f"[DEBUG] Clique executado na tentativa {tentativa}")
                    except Exception as e:
                        print(f"[WARNING] Clique normal falhou na tentativa {tentativa}: {e}")
                        # Tentar JavaScript como backup imediato
                        driver.execute_script(f"document.getElementById('{nome_checkbox}').click();")
                        time.sleep(0.5)
                        print(f"[DEBUG] Clique via JavaScript executado na tentativa {tentativa}")
                    
                    # Aguardar e verificar novamente
                    time.sleep(0.3)
                    
                    # Re-encontrar o elemento após o clique
                    checkbox = driver.find_element(By.ID, nome_checkbox)
                    
                    if not checkbox.is_selected():
                        print(f"[SUCCESS] Checkbox '{nome_checkbox}' desmarcada com sucesso na tentativa {tentativa}")
                        return True
                    else:
                        print(f"[WARNING] Checkbox '{nome_checkbox}' ainda está marcada após tentativa {tentativa}")
                        
                        # Tentar forçar desmarcação via JavaScript
                        driver.execute_script(f"document.getElementById('{nome_checkbox}').checked = false;")
                        time.sleep(0.3)
                        
                        # Verificar novamente
                        checkbox = driver.find_element(By.ID, nome_checkbox)
                        if not checkbox.is_selected():
                            print(f"[SUCCESS] Checkbox '{nome_checkbox}' desmarcada via JavaScript na tentativa {tentativa}")
                            return True
                        else:
                            print(f"[ERROR] JavaScript também falhou na tentativa {tentativa}")
                            if tentativa < max_tentativas:
                                print(f"[INFO] Tentando novamente... ({tentativa + 1}/{max_tentativas})")
                                time.sleep(1)  # Aguardar mais tempo antes da próxima tentativa
                                continue
                else:
                    print(f"[SUCCESS] Checkbox '{nome_checkbox}' já está desmarcada na tentativa {tentativa}")
                    return True
                    
            except Exception as e:
                print(f"[ERROR] Erro na tentativa {tentativa} ao verificar/desmarcar checkbox '{nome_checkbox}': {e}")
                if tentativa < max_tentativas:
                    print(f"[INFO] Tentando novamente após erro... ({tentativa + 1}/{max_tentativas})")
                    time.sleep(1)
                    continue
                else:
                    # Última tentativa com JavaScript como fallback
                    try:
                        driver.execute_script(f"document.getElementById('{nome_checkbox}').checked = false;")
                        print(f"[INFO] Tentativa final via JavaScript para '{nome_checkbox}'")
                        time.sleep(0.5)
                        
                        # Verificar se funcionou
                        checkbox = driver.find_element(By.ID, nome_checkbox)
                        if not checkbox.is_selected():
                            print(f"[SUCCESS] Checkbox '{nome_checkbox}' desmarcada na tentativa final via JavaScript")
                            return True
                    except:
                        pass
        
        print(f"[ERROR] Falha ao desmarcar checkbox '{nome_checkbox}' após {max_tentativas} tentativas")
        return False
      # Configurar Chrome com otimizações de velocidade
    options = Options()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--start-maximized')
    options.add_argument('--disable-blink-features=AutomationControlled')
    # Otimizações para velocidade (mantendo visibilidade)
    options.add_argument('--disable-web-security')
    options.add_argument('--disable-features=VizDisplayCompositor')
    options.add_argument('--disable-ipc-flooding-protection')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    try:
        # Inicializar driver
        print("[INFO] Inicializando Chrome...")
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
          # Navegar para mobie.pt
        print("[INFO] Navegando para mobie.pt...")
        driver.get("https://www.mobie.pt")
        
        # Aguardar página carregar de forma inteligente
        WebDriverWait(driver, 8).until(
            lambda d: d.execute_script("return document.readyState") == "complete"
        )
        
        # 1. Fechar modais (cookies, popups)
        print("[DEBUG] Verificando e fechando modais...")
        try:
            # Tentar diferentes seletores para fechar modais
            seletores_modal = [
                ".modal .btn-close",
                ".modal .close", 
                "[data-dismiss='modal']",
                ".cookie-close",
                ".cookies-accept",
                "[aria-label*='Close']"
            ]
            
            for selector in seletores_modal:
                try:
                    elementos = driver.find_elements(By.CSS_SELECTOR, selector)
                    for elem in elementos:
                        if elem.is_displayed():
                            driver.execute_script("arguments[0].click();", elem)
                            print(f"[SUCCESS] Modal fechado com {selector}")
                            time.sleep(0.8)  # Reduzido de 1.5 para 0.8
                except Exception:
                    pass
        except Exception as e:
            print(f"[INFO] Exceção ao fechar modal: {e}")
        
        # 2. Clicar em "Encontrar posto"
        print("[DEBUG] Clicando em 'Encontrar posto'...")
        try:
            # Tentar diferentes métodos para clicar
            metodos = [
                # Método 1: Link parcial
                lambda: driver.find_element(By.PARTIAL_LINK_TEXT, "Encontrar posto").click(),
                
                # Método 2: JavaScript com texto parcial
                lambda: driver.execute_script("Array.from(document.querySelectorAll('a')).find(a => a.innerText.includes('Encontrar posto')).click();"),
                
                # Método 3: XPath
                lambda: driver.find_element(By.XPATH, "//a[contains(text(), 'Encontrar posto')]").click(),
            ]
            
            for i, metodo in enumerate(metodos, 1):
                try:
                    metodo()
                    print(f"[SUCCESS] Clicado em 'Encontrar posto' (método {i})")
                    # Aguardar campo de pesquisa aparecer ao invés de tempo fixo
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.ID, "searchBox"))
                    )
                    break
                except Exception:
                    continue
            else:
                raise Exception("Não foi possível clicar em 'Encontrar posto'")
                
        except Exception as e:
            print(f"[ERROR] Erro ao clicar em 'Encontrar posto': {e}")
            driver.quit()
            return {"error": str(e)}
        
        # 3. Pesquisar posto
        print(f"[DEBUG] Pesquisando posto {posto_id}...")
        try:
            # Esperar campo de pesquisa
            campo_pesquisa = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.ID, "searchBox"))
            )              # VERIFICAÇÃO OBRIGATÓRIA: Desmarcar checkbox ANTES de pesquisar
            print("[CRITICAL] Executando verificação obrigatória da checkbox...")
            if not verificar_e_desmarcar_checkbox(driver, "availableStations", max_tentativas=3):
                error_msg = "ERRO CRÍTICO: Não foi possível desmarcar a checkbox 'availableStations'. Pesquisa pode retornar resultados incorretos."
                print(f"[ERROR] {error_msg}")
                driver.quit()
                return {"error": error_msg, "status": "checkbox_error"}
            
            # Aguardar um momento para garantir que mudanças sejam aplicadas
            time.sleep(0.5)
            
            # VERIFICAÇÃO FINAL CRÍTICA: Confirmar que checkbox está desmarcada antes de pesquisar
            print("[CRITICAL] Verificação final OBRIGATÓRIA da checkbox antes da pesquisa...")
            if not verificar_e_desmarcar_checkbox(driver, "availableStations", max_tentativas=3):
                error_msg = "ERRO CRÍTICO: Verificação final da checkbox falhou. Abortando para evitar resultados incorretos."
                print(f"[ERROR] {error_msg}")
                driver.quit()
                return {"error": error_msg, "status": "final_checkbox_verification_failed"}
            
            print("[SUCCESS] Checkbox confirmadamente desmarcada - prosseguindo com a pesquisa")            # Limpar, pesquisar e submeter
            campo_pesquisa.clear()
            time.sleep(0.3)  # Reduzido de 0.5 para 0.3
            campo_pesquisa.send_keys(posto_id)
            time.sleep(0.3)  # Reduzido de 0.5 para 0.3
            campo_pesquisa.send_keys(Keys.RETURN)
            print(f"[SUCCESS] Pesquisa executada para: {posto_id}")
            time.sleep(5)  # Reduzido de 8 para 5
            
            # Verificar se encontrou resultados
            try:
                resultado_texto = driver.find_element(By.CSS_SELECTOR, ".search-results-info").text
                print(f"[INFO] Resultado da pesquisa: {resultado_texto}")
                
                if "0 posto" in resultado_texto:
                    raise Exception("Nenhum posto encontrado na pesquisa")
            except:
                pass
                
        except Exception as e:
            print(f"[ERROR] Erro na pesquisa: {e}")
            driver.quit()
            return {"error": str(e)}
          # 4. Verificar se o posto apareceu nos resultados e depois clicar
        print("[DEBUG] Verificando se o posto apareceu nos resultados...")
        try:
            # Primeiro verificar se o ID do posto está presente na página
            try:
                # Aguardar até que o texto do posto apareça na página
                WebDriverWait(driver, 10).until(
                    lambda d: posto_id.lower() in d.page_source.lower()
                )
                print(f"[SUCCESS] Posto {posto_id} encontrado nos resultados")
            except:
                print(f"[ERROR] Posto {posto_id} não encontrado nos resultados da pesquisa")
                driver.quit()
                return {"error": f"Posto {posto_id} não apareceu nos resultados"}
              # Aguardar um pouco mais para garantir que a página carregou completamente
            time.sleep(0.5)  # Reduzido de 3 para 2
            
            print("[DEBUG] Clicando no resultado do posto...")
            
            # Tentar diferentes métodos para clicar no posto
            metodos_click_posto = [
                # Método 1: CSS específico
                lambda: driver.find_element(By.CSS_SELECTOR, 
                    "#js-portlet-_findstation_INSTANCE_zcgp_ > div > div > div.col-12.col-md-5.col-lg-4.pl-0.pr-1.find-station-info > div > div > div:nth-child(4) > div.d-flex.w-100.mb-2.mt-2.pb-2 > div > div.col-11 > div.row > div.col-7.d-flex.flex-column > label.text-street.mb-0"),
                
                # Método 2: XPath com ID do posto
                lambda: driver.find_element(By.XPATH, f"//*[contains(text(), '{posto_id}')]"),
                
                # Método 3: JavaScript com conteúdo
                lambda: driver.execute_script(f"""
                    var elementos = document.querySelectorAll('*');
                    for(var i=0; i<elementos.length; i++) {{
                        if(elementos[i].textContent.includes('{posto_id}')) {{
                            elementos[i].click();
                            return true;
                        }}
                    }}
                    return false;
                """)
            ]
            
            for i, metodo in enumerate(metodos_click_posto, 1):
                try:
                    if i < 3:  # Para métodos 1 e 2 que retornam elementos
                        elemento = metodo()
                        driver.execute_script("arguments[0].click();", elemento)
                    else:  # Para método 3 (JavaScript)
                        metodo()
                    print(f"[SUCCESS] Clicado no resultado do posto (método {i})")
                    time.sleep(2)  # Reduzido de 5 para 3
                    break
                except Exception:
                    continue
            else:
                raise Exception("Não foi possível clicar no resultado do posto")
                
        except Exception as e:
            print(f"[ERROR] Erro ao clicar no posto: {e}")
            driver.quit()
            return {"error": str(e)}
        
        # 5. Clicar em "Tarifário Regular"
        print("[DEBUG] Clicando em 'Tarifário Regular'...")
        try:
            # Aguardar para página carregar (tempo otimizado)
            time.sleep(1)  # Reduzido de 3 para 2
            
            # Tentar diferentes métodos para clicar em Tarifário Regular
            metodos_tarifario = [
                # Método 1: XPath
                lambda: driver.find_element(By.XPATH, "//*[contains(text(), 'Tarifário Regular')]"),
                
                # Método 2: JavaScript
                lambda: driver.execute_script("""
                    var elementos = document.querySelectorAll('*');
                    for(var i=0; i<elementos.length; i++) {
                        var elem = elementos[i];
                        if(elem.textContent && elem.textContent.includes('Tarifário Regular')) {
                            elem.click();
                            return elem;
                        }
                    }
                    return null;
                """)
            ]
            
            for i, metodo in enumerate(metodos_tarifario, 1):
                try:
                    if i == 1:  # Para método 1 que retorna elemento
                        elemento = metodo()
                        driver.execute_script("arguments[0].click();", elemento)
                    else:  # Para método 2 (JavaScript)
                        result = metodo()
                        if not result:
                            continue
                    print(f"[SUCCESS] Clicado em 'Tarifário Regular' (método {i})")
                    time.sleep(2)  # Reduzido de 5 para 3
                    break
                except Exception as e:
                    print(f"[INFO] Método {i} falhou: {e}")
                    continue
            else:
                print("[ERROR] Não foi possível clicar em 'Tarifário Regular', mas tentando continuar...")
                
        except Exception as e:            print(f"[ERROR] Erro ao clicar em Tarifário Regular: {e}")
            # Continuar mesmo se não conseguir clicar no tarifário
        
        # 6. EXTRAIR TEXTO DOS PAINÉIS E BLOCOS CCS
        print("\n" + "="*80)
        print("[DEBUG] EXTRAINDO BLOCOS CCS DOS PAINÉIS")
        print("="*80)
        
        # Lista para armazenar resultados
        blocos_ccs = []
        
        # Diferentes seletores para tentar encontrar os painéis
        seletores_paineis = [
            ".panel.panel-secondary.panel-sm",
            "div.panel.panel-secondary.panel-sm",
            "[class='panel panel-secondary panel-sm']",
            "[class*='panel'][class*='panel-secondary'][class*='panel-sm']"
        ]
        
        def extrair_blocos_ccs(texto_bruto):
            """
            Extrai blocos CCS do texto conforme especificado:
            - Encontra "CABLE" (case-insensitive) seguido imediatamente por "CCS"
            - Extrai texto de "CCS" até o próximo "CABLE" (não incluído) ou fim do texto
            """
            import re
            
            # Converter para maiúsculas para facilitar busca case-insensitive
            texto_upper = texto_bruto.upper()
            blocos = []
            
            # Encontrar todas as posições de "CABLE" seguido por "CCS"
            pattern = r'CABLE\s*CCS'
            matches = list(re.finditer(pattern, texto_upper))
            
            print(f"[DEBUG] Encontrados {len(matches)} padrões 'CABLE CCS' no texto")
            
            for i, match in enumerate(matches):
                # Posição onde "CCS" começa (após "CABLE ")
                inicio_ccs = match.start() + match.group().find('CCS')
                
                # Encontrar o próximo "CABLE" após esta posição
                proximos_cables = list(re.finditer(r'CABLE', texto_upper[match.end():]))
                
                if proximos_cables:
                    # Há outro "CABLE" depois - extrair até lá
                    fim_bloco = match.end() + proximos_cables[0].start()
                else:                    # Não há outro "CABLE" - extrair até o fim do texto
                    fim_bloco = len(texto_bruto)
                
                # Extrair o bloco do texto original (preservando case)
                bloco_texto = texto_bruto[inicio_ccs:fim_bloco].strip()
                
                if bloco_texto:
                    # Formatar texto em múltiplas linhas e classificar elementos
                    texto_formatado = bloco_texto
                    
                    # Inserir quebras de linha após padrões específicos
                    import re
                    
                    # 1. Quebra após CCS
                    texto_formatado = re.sub(r'(CCS)', r'\1\n', texto_formatado)
                    
                    # 2. Quebra ANTES de € (sempre)
                    texto_formatado = re.sub(r'(€)', r'\n\1', texto_formatado)
                    
                    # 3. Quebra após kWh (kilowatt-hora) - PRIMEIRO para não conflitar com kW
                    texto_formatado = re.sub(r'(kWh)', r'\1\n', texto_formatado)
                    
                    # 4. Quebra após kW (kilowatt) - APENAS se não for seguido de 'h' 
                    texto_formatado = re.sub(r'(kW)(?!h)', r'\1\n', texto_formatado)
                    
                    # Limpar quebras de linha múltiplas e espaços extras
                    texto_formatado = re.sub(r'\n\s*\n', '\n', texto_formatado)
                    texto_formatado = re.sub(r'^\s+|\s+$', '', texto_formatado, flags=re.MULTILINE)
                    texto_formatado = texto_formatado.strip()
                      # Classificar elementos automaticamente
                    linhas = [linha.strip() for linha in texto_formatado.split('\n') if linha.strip()]
                    
                    conector = ""
                    precos = []
                    potencia = ""
                    status = ""
                    
                    encontrou_kw = False
                    
                    for linha in linhas:
                        if linha == "CCS":
                            conector = linha
                        elif "€" in linha and "kW" in linha:
                            # Linha contém € e kW - dividir
                            import re
                            match = re.search(r'(.*?)([\d,]+\s*kW.*)', linha)
                            if match:
                                preco_parte = match.group(1).strip()
                                kw_parte = match.group(2).strip()
                                if preco_parte:
                                    precos.append(preco_parte)
                                if "kW" in kw_parte:
                                    # Extrair apenas a parte da potência
                                    kw_match = re.search(r'([\d,]+\s*kW)', kw_parte)
                                    if kw_match:
                                        potencia = kw_match.group(1)
                                        encontrou_kw = True
                                        # Resto após kW é status
                                        resto = kw_parte.replace(kw_match.group(1), '').strip()
                                        if resto:
                                            status = resto
                            else:
                                precos.append(linha)
                        elif "€" in linha:
                            precos.append(linha)
                        elif "kW" in linha and not encontrou_kw:
                            potencia = linha
                            encontrou_kw = True
                        elif encontrou_kw:  # Após encontrar kW, tudo é status
                            if status:
                                status += " " + linha
                            else:
                                status = linha
                      # Criar estrutura classificada
                    elementos_classificados = {
                        "conector": conector,
                        "precos": precos,
                        "potencia": potencia,
                        "status": status
                    }
                    
                    blocos.append({
                        'bloco_numero': i + 1,
                        'inicio_posicao': inicio_ccs,
                        'fim_posicao': fim_bloco,
                        'texto': bloco_texto,
                        'texto_formatado': texto_formatado,
                        'elementos_classificados': elementos_classificados
                    })
                    
                    print(f"\n[DEBUG] BLOCO CCS {i + 1}:")
                    print(f"   Posição: {inicio_ccs}-{fim_bloco}")
                    print(f"   Texto original: {bloco_texto}")
                    print(f"   Texto formatado:")
                    for linha in texto_formatado.split('\n'):
                        if linha.strip():
                            print(f"      {linha.strip()}")
                    print(f"   CLASSIFICAÇÃO:")
                    print(f"      Conector: {elementos_classificados['conector']}")
                    print(f"      Preços: {elementos_classificados['precos']}")
                    print(f"      Potência: {elementos_classificados['potencia']}")
                    print(f"      Status: {elementos_classificados['status']}")
            
            return blocos
        
        # Tentar cada seletor
        for seletor in seletores_paineis:
            try:
                print(f"\n[DEBUG] Tentando seletor: {seletor}")
                paineis = driver.find_elements(By.CSS_SELECTOR, seletor)
                print(f"   Encontrados: {len(paineis)} painéis")
                
                if paineis:
                    # Processar cada painel encontrado
                    for i, painel in enumerate(paineis, 1):                        
                        try:
                            if painel.is_displayed():
                                texto_bruto = painel.get_attribute('textContent').strip()
                                if texto_bruto:
                                    print(f"\n--- PAINEL {i} ---")
                                    print("="*60)
                                    print(f"Texto completo do painel:")
                                    print(texto_bruto)
                                    print("-"*60)
                                    
                                    # Extrair blocos CCS deste painel
                                    blocos_do_painel = extrair_blocos_ccs(texto_bruto)
                                    
                                    if blocos_do_painel:
                                        print(f"[SUCCESS] Encontrados {len(blocos_do_painel)} blocos CCS no painel {i}")
                                        
                                        # Adicionar cada bloco aos resultados
                                        for bloco in blocos_do_painel:
                                            blocos_ccs.append({
                                                'painel_numero': i,
                                                'seletor': seletor,
                                                'bloco_numero': bloco['bloco_numero'],
                                                'inicio_posicao': bloco['inicio_posicao'],
                                                'fim_posicao': bloco['fim_posicao'],
                                                'texto_bloco_ccs': bloco['texto'],
                                                'texto_bloco_ccs_formatado': bloco.get('texto_formatado', bloco['texto']),
                                                'elementos_classificados': bloco.get('elementos_classificados', {}),
                                                'texto_completo_painel': texto_bruto
                                            })
                                    else:
                                        print(f"[INFO] Nenhum bloco CCS encontrado no painel {i}")
                                    
                                    print("="*60)
                                        
                        except Exception as e:
                            print(f"[ERROR] Erro ao processar painel {i}: {e}")
                
                    # Se encontramos painéis com este seletor, não precisamos tentar os outros
                    if paineis:
                        break
                
            except Exception as e:
                print(f"[ERROR] Erro ao usar seletor {seletor}: {e}")
                continue
        
        # Se não encontramos painéis, tentar método alternativo
        if not blocos_ccs:
            print("\n[DEBUG] Tentando método alternativo para encontrar painéis...")
            try:
                # Usar JavaScript para encontrar todos os elementos que podem ser painéis
                potenciais_paineis = driver.execute_script("""
                    return Array.from(document.querySelectorAll('*')).filter(elem => {
                        let classes = elem.getAttribute('class');
                        return classes && classes.includes('panel') && 
                               classes.includes('panel-secondary') && 
                               classes.includes('panel-sm');
                    }).map(el => el.textContent.trim());
                """)
                
                if potenciais_paineis:
                    for i, texto in enumerate(potenciais_paineis, 1):
                        if texto:
                            print(f"\n--- PAINEL (JS) {i} ---")
                            print("="*60)
                            print(f"Texto completo: {texto}")
                            print("-"*60)
                            
                            # Extrair blocos CCS deste painel
                            blocos_do_painel = extrair_blocos_ccs(texto)
                            
                            if blocos_do_painel:
                                print(f"[SUCCESS] Encontrados {len(blocos_do_painel)} blocos CCS no painel {i}")
                                  # Adicionar cada bloco aos resultados
                                for bloco in blocos_do_painel:
                                    blocos_ccs.append({
                                        'painel_numero': i,
                                        'seletor': 'javascript',
                                        'bloco_numero': bloco['bloco_numero'],
                                        'inicio_posicao': bloco['inicio_posicao'],
                                        'fim_posicao': bloco['fim_posicao'],
                                        'texto_bloco_ccs': bloco['texto'],                                        'texto_bloco_ccs_formatado': bloco.get('texto_formatado', bloco['texto']),
                                        'texto_completo_painel': texto
                                    })
                            else:
                                print(f"[INFO] Nenhum bloco CCS encontrado no painel {i}")
                            
                            print("="*60)
            except Exception as e:
                print(f"[ERROR] Erro no método alternativo: {e}")
        
        print(f"\n[RESULT] TOTAL: {len(blocos_ccs)} blocos CCS extraídos")
        
        # 7. Fechar navegador imediatamente após extração
        print("\n[EMOJI] Fechando navegador...")
        driver.quit()
        print("[SUCCESS] Navegador fechado com sucesso!")
        
        # Retornar resultado
        resultado = {
            "posto_id": posto_id,
            "timestamp": datetime.now().isoformat(),
            "total_blocos_ccs": len(blocos_ccs),
            "blocos_ccs": blocos_ccs
        }
        
        return resultado
            
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
    # Verificar se foi fornecido um posto_id como argumento
    if len(sys.argv) > 1:
        posto_id = sys.argv[1].upper()  # Converter para maiúsculas
    else:
        posto_id = "BRR-00137"  # ID padrão se não for fornecido
        print("[WARNING] Nenhum posto_id fornecido, usando padrão: BRR-00137")
    
    print("=" * 60)
    print(f" EXTRAÇÃO OTIMIZADA DE BLOCOS CCS - POSTO {posto_id}")
    print("=" * 60)
    
    # Medir tempo de execução
    start_time = time.time()
    resultado = extrair_paineis_tarifario(posto_id)
    end_time = time.time()
    
    tempo_execucao = end_time - start_time
    print(f"\n[TIME] TEMPO DE EXECUÇÃO: {tempo_execucao:.2f} segundos")
    
    # Adicionar tempo ao resultado
    if isinstance(resultado, dict):
        resultado["tempo_execucao_segundos"] = round(tempo_execucao, 2)
    
    print("\n[RESULT] RESULTADO FINAL:")
    print(json.dumps(resultado, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
