document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        top: document.getElementById('top-border'),
        bottom: document.getElementById('bottom-border'),
        left: document.getElementById('left-border'),
        right: document.getElementById('right-border'),
        animation: document.getElementById('animation-container')
    };

    function drawBorders() {
        // Cria um elemento temporário para medir o tamanho exato de um caractere
        const tempSpan = document.createElement('span');
        tempSpan.style.fontFamily = "'Courier New', Courier, monospace";
        tempSpan.style.fontSize = "16px";
        tempSpan.textContent = '+';
        tempSpan.style.position = 'absolute';
        tempSpan.style.visibility = 'hidden';
        document.body.appendChild(tempSpan);
        const charWidth = tempSpan.offsetWidth;
        const charHeight = tempSpan.offsetHeight;
        document.body.removeChild(tempSpan);

        if (charWidth === 0 || charHeight === 0) return;

        // Calcula quantos caracteres cabem na tela (horizontal e vertical)
        // Usamos Math.ceil para garantir que não faltem caracteres, o overflow:hidden cuida do excesso.
        const cols = Math.ceil(window.innerWidth / charWidth);
        const rows = Math.ceil(window.innerHeight / charHeight);

        // Preenche as bordas horizontais com uma linha sólida de '+'
        elements.top.textContent = '+'.repeat(cols);
        elements.bottom.textContent = '+'.repeat(cols);

        // Preenche as bordas verticais com '+' separados por quebras de linha
        const verticalBorderText = Array(rows).fill('+').join('\n');
        elements.left.textContent = verticalBorderText;
        elements.right.textContent = verticalBorderText;
    }

    // --- LÓGICA DA ANIMAÇÃO (A SER SUBSTITUÍDA) ---
    // **COLOQUE SEUS 16 FRAMES AQUI**
    const animationFrames = [
        `                                                            
                                                            
                                                            
                                   .-                       
                                   =-=                      
                                 ==--                       
                               ====;-        .=-===         
                              =*--= -=.    ;========*;      
                                     ;-= -===--===--=-;     
       ;         -=-==========--.  .=-==========- -===-=    
     -=======-; --========----;;;=-  ;;.;.;-;;=       =;.   
      ---.     .;-=---;-=-====;-=.-  -;.-=--=-              
                ;----;;-;-=-==----==-=--;;;-                
                 ;---;;--   -------=;=-=;;                  
              =-;.  ---          ;--=--;=                   
                - .--              ;-;                      
                  =  *=;         =- ;-                      
                   ;    -=     =*    -.                     
                  .      .   ;*   . .                       
                          ;=.                               
                         -.                                 
...-......;;;;;;-;...  ....;;----;;;;;;.;-.;.;;.  ... ...;;.
 .;.;;...........;............................;;;;;;;;;;;;;;
        `,
        `                                                            
                                                            
                                                            
                                     *%*                    
                                    &**%                    
                                 ;*%%=            %         
                               ;*****&;      .%***&%%.      
                                 .=; &**  %*****%*****%     
                     .==;..    ;      ;***&&%*%*****%%%*    
       .&;.      .&*%*****%*******%.  ;=*%=%**=%&   .%&%%*  
       %*****%&%. %&%%%*%%%%&&&&&%*.; ==;=;%&=%             
       ;=*.      =***%%*&%*****%**=*&==&===&%*.             
                   *****%%%*******%****%*&=&                
                    .%%%%%&    &%%&%%&%%%%%;                
                  &**   %%          %%%%%;                  
                   *%  %*.         .%%;=%%                  
                      ;%&%*&      .*%    .=                 
                        =;. ;**  =**&   &*.                 
                               ;                            
                                                            
                                                            
%&==%&=====;;;;;=;==;;;;;;.;.;..;;;;;...;;......;.;;;;;;;;;.
 =%%%%&========&=;==;;;;;;;;;;;;=;;;;;;;;;;;;;;;;;;;;;;=;;;;
        `,
        `                                                                                                
                               .*.    ***                          ... .* ..                    
                ********************** ***********                *..*****...                   
              ****.   *..**         ....*************        ***.****.*************             
            ****                   .....*******    ****     **         ******** ******          
            ***                   .....*****.***       *   *            *******     .***        
            ****   ......           .*** ********      .****             ********    ****       
            *****........                ********                         *******       ***     
          ************.                 ****** **                         ********         *    
         ************              ***** ********                          *******        **.   
       ***************.        ******************                  ********.******         *    
      ******************      ********     *****                ******************         **   
      **********     ****    *****        ******              ****         ******          ...  
     *********         ***     *****      *****              ***          ******          ..... 
     ********            *****  *****.     ***             ****          ******          *..... 
     ********               ****** **** ******             **            ***          ****..... 
     ********.                   ******  ****            ***             ****         ********  
      ******** .                      *** ** ......     ***              .**          ********  
      **********                      *****  ........                     **        *********   
       *******                       ***  ** .........******               **       ***** ***   
      *********                    **.      *** ......***********          ****************     
     ****.******                   **         *************    *****     ******************     
    ****   *****                   **              ************       *. ***     ********       
    ***     *****                   *                  **********    **    **************       
   ****       ***                                        ***** ***                  ****        
   ***         ****                                      ****** ****                 ****       
   **           ****                                     ****** ******                ****      
  **             ****                                    ***************                 **     
  ***              ****                                   ******************              ***   
  **                 **                                   *******        ******           **    
 ***                 **                                     *****          *******       **     
                     **                                      *******             ***            
                    ***                                            *******                      

        `,
        `erra
        `,
        `errad
        `,
        `errado
        `
    ];
    let currentFrame = 0;
    const frameRate = 250;

    function updateAnimation() {
        elements.animation.textContent = animationFrames[currentFrame];
        currentFrame = (currentFrame + 1) % animationFrames.length;
    }

    // --- INICIALIZAÇÃO ---
    drawBorders();
    setInterval(updateAnimation, frameRate);
    window.addEventListener('resize', drawBorders);
});