================================================================================
 Copyright (c) Bridgetek Pte Ltd.                                               
                                                                                
 THIS SOFTWARE IS PROVIDED BY BRIDGETEK PTE LTD. ``AS IS'' AND ANY EXPRESS OR   
 IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF   
 MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO     
 EVENT SHALL BRIDGETEK PTE LTD BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,  
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,   
 PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES, LOSS OF USE, DATA, OR PROFITS OR  
 BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER  
 IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)     
 ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE     
 POSSIBILITY OF SUCH DAMAGE.                                                    
================================================================================


1. INTRODUCTION
   SampleApp is developed to showcase the usage of Eve instructions and commands as well as 
the basic procedures to configure Eve. It is in tutorial fashion for users to examine the 
individual functions.

2. FOLDER Structure
    ├───Project                  
    │   ├───Msvc                      | Microsoft Visual Studio C++ 2019 IDE solution file for FT4222 or MPSSE platform
    │   └───Msvc_Emulator             | Microsoft Visual Studio C++ 2019 IDE solution file for Eve emulator platform
    ├───Hdr                           | Header files
    ├───Src                           | Source files
    ├───common                        | Provide provide unique APIs to control every hardware

2. SUPPORTED PLATFORM
    * Microsoft Visual C++ platform with FT4222 or MPSSE
    * Microsoft Visual C++ platform with Emulator
    
3. SETUP AND RUN
    3.1 CONNECT HARDWARE           
        3.1.1 Microsoft Visual C++ platform with FT4222 and MPSSE
            - Connect PC with EVE platform via FT4222 or MPSSE
            - Connect power to EVE platform
            
        3.1.2 Microsoft Visual C++ platform with Emulator
            - This setup uses window PC only
        
    3.2 BUILD AND RUN           
        3.2.1 Microsoft Visual C++ platform with FT4222 and MPSSE
            - Open project in Project\MSVC with Microsoft Visual C++
            - Build (Ctrl + B)
            - Run (F5)
            
        3.2.2 Microsoft Visual C++ platform with Emulator
            - Open project in Project\Msvc_Emulator with Microsoft Visual C++
            - Build (Ctrl + B)
            - Run (F5)

4. CONFIGURATION INSTRUCTIONS
    Sample application uses the macros to configure the platforms: 
	
    Host platform: Defined with ESD_TARGET_PLATFORM, such as:
        - Window host: EVE_PLATFORM_FT4222, EVE_PLATFORM_MPSSE
        - Emulator   : EVE_PLATFORM_BT8XXEMU
    
    EVE platform: Defined with ESD_TARGET_GRAPHICS, such as:
		EVE_GRAPHICS_FT800  EVE_GRAPHICS_FT801
		EVE_GRAPHICS_FT810  EVE_GRAPHICS_FT811
		EVE_GRAPHICS_FT812  EVE_GRAPHICS_FT813
        EVE_GRAPHICS_BT815  EVE_GRAPHICS_BT816
        EVE_GRAPHICS_BT817  EVE_GRAPHICS_BT818
    
    Please see common\eve_hal\EVE_Config.h. for more macros.
            
                                   【END】