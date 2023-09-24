import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  headerWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    height: 34,
    backgroundColor: '#F6FCFC',
    width: 250,
    color: '#00ACD4',
    paddingLeft: 7,
    paddingRight: 3,
    borderRadius: '5px',
    fontFamily: 'Montserrat',
    fontWeight: 700,
    marginBottom: '6px',
  },
  label: {
    textTransform: 'uppercase',
    alignItems: 'center',
    marginTop: '4px',
  },
  iconWrapper: {
    padding: '5px',
  },
  topIcon: {
    width: '20px',
    height: '20px',
    // borderRadius: '5px',
  },
});

const MainHeader = ({ leftText, leftIcon, rightText, rightIcon }: any) => (
  <>
    <View style={styles.headerWrapper}>
      <View style={styles.container}>
        <Text style={styles.label}>{leftText}</Text>
        <View style={styles.iconWrapper}>
          {leftIcon && <Image src={leftIcon} style={styles.topIcon} />}
        </View>
      </View>
      <View style={[styles.container, { marginLeft: 10 }]}>
        <Text style={styles.label}>{rightText}</Text>
        <View style={styles.iconWrapper}>
          {rightIcon && <Image src={rightIcon} style={styles.topIcon} />}
        </View>
      </View>
    </View>
  </>
);

export default MainHeader;
