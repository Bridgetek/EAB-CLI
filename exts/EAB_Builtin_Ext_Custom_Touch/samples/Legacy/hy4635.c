int i2c_addr()
{
    return 0x38;                    // 7-bit I2C slave address
}

void setup()
{
    setWAKE(0);                     // set reset pin to low
    delay_ms(30);                   // wait for 30ms
    setWAKE(1);                     // set reset pin to high
    delay_ms(300);                  // wait for 300ms
}

void loop()
{
    int x, id_y;

    while (getINT() == 1)           // wait for INT to go low
        ;
    i2c_startread(0x02);            // start I2C read cycle
       
    int n_touches = i2c_read8() & 0x0F; // read number of touch points

    while (n_touches != 0) 
    {
        x = i2c_read16be();         // read 12-bit X value
        id_y = i2c_read16be();      // read id and 12-bit Y value

        report_touch(((id_y >> 12) & 0x000F), (x & 0x0FFF), (id_y & 0x0FFF));   // report id, X and Y values

        i2c_read8();                // read 1 byte
        i2c_read8();
	
        n_touches = n_touches - 1;
    }
       
    i2c_stop();                     // end I2C read cycle

    while (getINT() == 0)           // wait for INT to go high
        ;
}