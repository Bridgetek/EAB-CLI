#config I2C_ADDRSIZE    16                  // touch is using 16-bit register address

int i2c_addr()
{
    return 0x14;                            // 7-bit I2C slave address
}

void setup()
{
    setINT(0);                              // set Interrupt pin low
    setWAKE(0);                             // set reset pin low
    delay_ms(1);                            // wait for 1ms  
    setINT(1);                              // Hi-Z (pull up externally)
    delay_us(150);                          // wait for 150us
    setWAKE(1);                             // set reset pin high
    delay_ms(5);                            // wait for 5ms
    setINT(0);                              // set Interrupt pin to low
    delay_ms(50);                           // wait for 50ms
    setINT(1);                              // Hi-Z
}

void rtouch()
{
    int id = i2c_read8();                   // read id
    int x = i2c_read16le();                 // read 16-bit X value
    int y = i2c_read16le();                 // read 16-bit Y value

    i2c_read8();                            // read 1 byte
    i2c_read8();
    i2c_read8();

    report_touch(id, x, y);                 // report id, X and Y values
}

void loop()
{
    int n_touch = 0;
    int trig = 0;

    i2c_startread(0x804D);                  // check the INT trigger mechanism
    trig = i2c_read8() & 0x03;
    i2c_stop();

    if((trig == 0x00) || ( trig == 0x03))   // rising edge or high level
    {
        while (getINT() == 0);    
    }
    else                                    // falling edge or low level
    {		
        while (getINT() == 1);    
    }

    i2c_startread(0x814e);                  // start I2C read cycle

    n_touch = i2c_read8() & 0xf;            // read number of touch points

    while (n_touch != 0)
    {
        rtouch();
        n_touch = n_touch - 1;
    }

    i2c_stop();                             // end I2C read cycle
    i2c_regwr(0x814e, 0x00);                // write 0 to clear buffer status

    if((trig == 0x00) || (trig ==0x03))     // rising edge or high level
    {
        while (getINT() == 1);
    }
    else                                    // falling edge or low level
    {
        while (getINT() == 0);
    }
}
